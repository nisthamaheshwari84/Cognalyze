"use client";

import React from "react";
import { SimulationVariableAccumulator } from "@/lib/skills/learn/content-schemas";
import { Cpu, Zap } from "lucide-react";

export interface VariableRegisterBankProps {
  variables: SimulationVariableAccumulator[];
  className?: string;
}

export default function VariableRegisterBank({
  variables,
  className = ""
}: VariableRegisterBankProps) {
  if (!variables || variables.length === 0) return null;

  return (
    <div
      className={`bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 shadow-xs ${className}`}
    >
      <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
        <Cpu className="w-3.5 h-3.5 text-blue-600" />
        <span>Working Registers & Accumulators</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {variables.map((v, idx) => (
          <div
            key={idx}
            className={`flex flex-col p-2.5 rounded-xl border transition-all duration-200 ${
              v.isHighlighted
                ? "bg-amber-50/70 border-amber-300 text-amber-950 shadow-xs ring-1 ring-amber-300/60"
                : "bg-white border-slate-200/90 text-slate-900 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono font-semibold text-slate-500">
                {v.name}
              </span>
              {v.isHighlighted && (
                <span className="flex items-center text-[10px] text-amber-700 font-bold">
                  <Zap className="w-3 h-3 mr-0.5" />
                  Peak
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-xl font-mono font-black tracking-tight text-slate-900">
                {String(v.value)}
              </span>

              {v.delta && (
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    v.delta.includes("reset")
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : v.delta.startsWith("+")
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  {v.delta}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
