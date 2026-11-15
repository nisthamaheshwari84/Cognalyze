"use client";

import React from "react";
import { X, ExternalLink, ShieldCheck, Clock, Award, ArrowRight } from "lucide-react";
import Link from "next/link";

export interface CompareItem {
  id: string;
  title: string;
  organizer: string;
  category: string;
  location: string;
  workMode: string;
  deadline?: string | null;
  fitScore?: number;
  eligibilityStatus?: string;
  verificationBadge?: "Verified Live Posting" | "Curated Benchmark";
  requiredSkills: string[];
  missingSkills?: string[];
  applyUrl?: string;
}

interface CompareDrawerProps {
  items: CompareItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function CompareDrawer({ items, onRemove, onClear }: CompareDrawerProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              Side-by-Side Opportunity Comparison
            </h2>
            <p className="text-xs text-slate-400">
              Comparing {items.length} opportunity target{items.length === 1 ? "" : "s"} across Student DNA fit, verification, and technical requirements.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClear}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition"
            >
              Clear All
            </button>
            <button
              onClick={onClear}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="overflow-x-auto p-6 flex-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="py-3 pr-4 font-medium text-slate-400 w-36">Dimension</th>
                {items.map((item) => (
                  <th key={item.id} className="py-3 px-4 font-semibold text-white min-w-[220px]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-white line-clamp-1">{item.title}</div>
                        <div className="text-xs text-cyan-400 font-normal">{item.organizer}</div>
                      </div>
                      <button
                        onClick={() => onRemove(item.id)}
                        className="text-slate-500 hover:text-rose-400 transition"
                        title="Remove from comparison"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {/* Authenticity Badge */}
              <tr>
                <td className="py-3 pr-4 font-medium text-slate-400">Provenance</td>
                {items.map((item) => (
                  <td key={item.id} className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                        item.verificationBadge === "Verified Live Posting"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {item.verificationBadge || "Curated Benchmark"}
                    </span>
                  </td>
                ))}
              </tr>

              {/* DNA Fit Score */}
              <tr>
                <td className="py-3 pr-4 font-medium text-slate-400">Student DNA Fit</td>
                {items.map((item) => (
                  <td key={item.id} className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-emerald-400">
                        {item.fitScore !== undefined ? `${item.fitScore}%` : "—"}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {item.eligibilityStatus || "Eligible"}
                      </span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Category & Work Mode */}
              <tr>
                <td className="py-3 pr-4 font-medium text-slate-400">Type & Mode</td>
                {items.map((item) => (
                  <td key={item.id} className="py-3 px-4 text-slate-300">
                    <div className="capitalize font-medium text-white">{item.category}</div>
                    <div className="text-[11px] text-slate-400">{item.workMode} · {item.location}</div>
                  </td>
                ))}
              </tr>

              {/* Deadline */}
              <tr>
                <td className="py-3 pr-4 font-medium text-slate-400">Deadline</td>
                {items.map((item) => (
                  <td key={item.id} className="py-3 px-4 font-mono text-slate-300">
                    {item.deadline ? new Date(item.deadline).toLocaleDateString() : "Rolling Admission"}
                  </td>
                ))}
              </tr>

              {/* Required Skills */}
              <tr>
                <td className="py-3 pr-4 font-medium text-slate-400">Required Skills</td>
                {items.map((item) => (
                  <td key={item.id} className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {item.requiredSkills.slice(0, 4).map((sk, idx) => (
                        <span key={idx} className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Skill Gaps */}
              <tr>
                <td className="py-3 pr-4 font-medium text-slate-400">Evidence Gaps</td>
                {items.map((item) => (
                  <td key={item.id} className="py-3 px-4 text-slate-400">
                    {item.missingSkills && item.missingSkills.length > 0 ? (
                      <span className="text-amber-400 text-[11px]">
                        Need proof: {item.missingSkills.slice(0, 2).join(", ")}
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-[11px]">All core requirements verified</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Direct Actions */}
              <tr>
                <td className="py-3 pr-4 font-medium text-slate-400">Actions</td>
                {items.map((item) => (
                  <td key={item.id} className="py-3 px-4">
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/interview?mode=technical&oppId=${encodeURIComponent(item.id)}&title=${encodeURIComponent(item.title)}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition"
                      >
                        Launch Mock Interview
                      </Link>
                      <Link
                        href={`/student/opportunities/${encodeURIComponent(item.id)}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition"
                      >
                        View Full Blueprint <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
