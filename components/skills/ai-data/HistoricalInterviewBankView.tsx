"use client";

import React, { useState, useMemo } from "react";
import {
  HistoricalCompanyQuestion,
  HISTORICAL_COMPANY_QUESTIONS_BANK,
  getHistoricalCompanyQuestions
} from "@/lib/skills/ai-data/historical-company-bank";
import { TargetRoleSlug } from "@/lib/skills/ai-data/types";

interface HistoricalInterviewBankViewProps {
  initialRole?: TargetRoleSlug;
  onSelectQuestion?: (question: HistoricalCompanyQuestion) => void;
}

export default function HistoricalInterviewBankView({
  initialRole,
  onSelectQuestion
}: HistoricalInterviewBankViewProps) {
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>(initialRole || "all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>("stripe-de-01");
  const [currentPage, setCurrentPage] = useState<number>(0);
  const pageSize = 5;

  // Filter queries
  const filterResult = useMemo(() => {
    return getHistoricalCompanyQuestions({
      companySlug: selectedCompany === "all" ? undefined : selectedCompany,
      targetRole: selectedRole === "all" ? undefined : (selectedRole as TargetRoleSlug),
      category: selectedCategory === "all" ? undefined : (selectedCategory as any),
      searchQuery: searchQuery || undefined,
      limit: 100,
      offset: 0
    });
  }, [selectedCompany, selectedRole, selectedCategory, searchQuery]);

  const totalPages = Math.ceil(filterResult.questions.length / pageSize);
  const currentQuestions = filterResult.questions.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const companiesList = ["all", "google", "stripe", "meta", "openai", "netflix", "amazon", "snowflake", "uber", "databricks", "bytedance"];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-6 space-y-6 my-6">
      {/* Top Banner */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            Verified Historical Company Questions
          </span>
          <span className="text-xs text-slate-400">
            {HISTORICAL_COMPANY_QUESTIONS_BANK.length} Source-Backed Questions Across Tier-1 Tech
          </span>
        </div>
        <h3 className="text-xl font-bold text-white mt-1">Company-Specific Technical Interview Intelligence</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Real technical interview questions asked at top employers with source provenance, optimal time/space complexity analysis,
          and common candidate pitfalls. (Resolved from legacy 2-question limit to full catalog).
        </p>
      </div>

      {/* Filter Controls */}
      <div className="space-y-3">
        {/* Company Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-2">Company:</span>
          {companiesList.map((comp) => (
            <button
              key={comp}
              onClick={() => {
                setSelectedCompany(comp);
                setCurrentPage(0);
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                selectedCompany === comp
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              {comp}
            </button>
          ))}
        </div>

        {/* Search & Role Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Search problems, companies, or keywords..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0);
            }}
            className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />

          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setCurrentPage(0);
            }}
            className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Roles</option>
            <option value="ai_engineer">AI Engineer</option>
            <option value="ml_engineer">ML Engineer</option>
            <option value="data_scientist">Data Scientist</option>
            <option value="data_engineer">Data Engineer</option>
            <option value="genai_llm_engineer">GenAI / LLM Engineer</option>
            <option value="mlops_engineer">MLOps Engineer</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(0);
            }}
            className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="data_engineering">Data Engineering</option>
            <option value="genai_rag">GenAI & RAG</option>
            <option value="sql">SQL & Analytics</option>
            <option value="ml_theory">ML Theory</option>
            <option value="system_design">System Design</option>
          </select>
        </div>
      </div>

      {/* Question Results List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>Showing {filterResult.questions.length} verified company questions</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-2 py-1 rounded bg-slate-800 disabled:opacity-40 text-slate-200"
              >
                Prev
              </button>
              <span>
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-2 py-1 rounded bg-slate-800 disabled:opacity-40 text-slate-200"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {currentQuestions.map((q) => {
          const isExpanded = expandedQuestionId === q.id;
          return (
            <div
              key={q.id}
              className={`rounded-xl border transition-all ${
                isExpanded ? "border-indigo-500/50 bg-slate-950" : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
              }`}
            >
              {/* Card Header */}
              <div
                onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                className="p-4 cursor-pointer flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                      {q.companyName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                      ✓ {q.provenance.type.replace("_", " ")} ({q.provenance.reportingYear})
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {q.interviewStage.replace(/_/g, " ")}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white hover:text-indigo-300 transition-colors">
                    {q.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 capitalize">
                    {q.difficulty}
                  </span>
                  <span className="text-slate-400 text-sm">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="p-5 border-t border-slate-800/80 space-y-4 text-xs">
                  {/* Context & Statement */}
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Business Context</span>
                    <p className="text-slate-300 leading-relaxed">{q.businessContext}</p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Problem Statement</span>
                    <p className="text-slate-300 leading-relaxed">{q.problemStatement}</p>
                  </div>

                  {/* Constraints */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-bold text-slate-300 block mb-1">Constraints & SLAs:</span>
                    <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                      {q.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Solution Blueprint */}
                  <div className="rounded-lg border border-slate-800 overflow-hidden bg-slate-900">
                    <div className="px-3 py-2 bg-slate-800/60 text-slate-300 font-semibold flex justify-between items-center">
                      <span>Optimal Solution Blueprint</span>
                      <span className="text-emerald-400 font-mono">
                        {q.solutionBlueprint.timeComplexity} | {q.solutionBlueprint.spaceComplexity}
                      </span>
                    </div>
                    <pre className="p-3 text-xs font-mono text-emerald-300 overflow-x-auto">
                      {q.solutionBlueprint.codeOrQuerySnippet}
                    </pre>
                  </div>

                  {/* Common Pitfalls & Follow-ups */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20">
                      <span className="font-bold text-rose-400 block mb-1">⚠️ Common Candidate Pitfalls:</span>
                      <ul className="list-disc list-inside text-slate-300 space-y-1">
                        {q.commonPitfalls.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/20">
                      <span className="font-bold text-indigo-400 block mb-1">🎯 Common Follow-Up Questions:</span>
                      <ul className="list-disc list-inside text-slate-300 space-y-1">
                        {q.followUpQuestions.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {onSelectQuestion && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => onSelectQuestion(q)}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md"
                      >
                        Simulate This Company Question in Interview Studio →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

