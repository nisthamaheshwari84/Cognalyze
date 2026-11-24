"use client";

import React from "react";
import { Globe, Check } from "lucide-react";

export interface DualLanguageToggleProps {
  language: "en" | "hinglish";
  onToggle: (lang: "en" | "hinglish") => void;
  className?: string;
}

export default function DualLanguageToggle({
  language,
  onToggle,
  className = ""
}: DualLanguageToggleProps) {
  return (
    <div
      className={`inline-flex items-center p-1 bg-slate-100 border border-slate-200/90 rounded-xl shadow-xs ${className}`}
      role="group"
      aria-label="Language Selector"
    >
      <div className="flex items-center px-2 py-1 text-slate-500 text-xs font-semibold mr-1">
        <Globe className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
        <span className="hidden sm:inline">Explanation:</span>
      </div>

      <button
        type="button"
        onClick={() => onToggle("en")}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
          language === "en"
            ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
        }`}
      >
        <span>English</span>
        {language === "en" && <Check className="w-3 h-3 ml-1 text-blue-600" />}
      </button>

      <button
        type="button"
        onClick={() => onToggle("hinglish")}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
          language === "hinglish"
            ? "bg-white text-amber-900 shadow-sm border border-amber-300/80"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
        }`}
      >
        <span>Hinglish</span>
        <span
          className={`text-[9px] uppercase tracking-wider px-1 py-0.5 rounded font-mono font-bold ml-1 ${
            language === "hinglish"
              ? "bg-amber-100 text-amber-800"
              : "bg-slate-200 text-slate-600"
          }`}
        >
          HI-EN
        </span>
        {language === "hinglish" && <Check className="w-3 h-3 ml-1 text-amber-600" />}
      </button>
    </div>
  );
}
