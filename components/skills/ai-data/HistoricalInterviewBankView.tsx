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
    <div className="bg-[#FFFFFF] border border-[#E4E1DA] rounded-xl shadow-sm p-6 space-y-6 my-6 text-[#17191C]">
      {/* Top Banner */}
      <div className="border-b border-[#E4E1DA] pb-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF4FE] text-[#356AE6] border border-[#D2E0FB]">
            Verified Historical Company Questions
          </span>
          <span className="text-xs text-[#667085]">
            {HISTORICAL_COMPANY_QUESTIONS_BANK.length} Source-Backed Questions Across Tier-1 Tech
          </span>
        </div>
        <h3 className="text-xl font-bold text-[#162A43] mt-1">Company-Specific Technical Interview Intelligence</h3>
        <p className="text-xs text-[#667085] mt-1 max-w-3xl">
          Real technical interview questions asked at top employers with source provenance, optimal time/space complexity analysis,
          and common candidate pitfalls. (Resolved from legacy 2-question limit to full catalog).
        </p>
      </div>

      {/* Filter Controls */}
      <div className="space-y-3">
        {/* Company Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-[#667085] mr-2">Company:</span>
          {companiesList.map((comp) => (
            <button
              key={comp}
              onClick={() => {
                setSelectedCompany(comp);
                setCurrentPage(0);
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                selectedCompany === comp
                  ? "bg-[#162A43] text-white shadow-sm"
                  : "bg-[#FAF9F6] text-[#667085] border border-[#E4E1DA] hover:border-[#356AE6] hover:text-[#162A43]"
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
            className="p-2.5 rounded-lg bg-[#FAF9F6] border border-[#E4E1DA] text-xs text-[#162A43] placeholder-[#98A2B3] focus:outline-none focus:border-[#356AE6] focus:bg-[#FFFFFF]"
          />

          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setCurrentPage(0);
            }}
            className="p-2.5 rounded-lg bg-[#FAF9F6] border border-[#E4E1DA] text-xs text-[#162A43] focus:outline-none focus:border-[#356AE6]"
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
            className="p-2.5 rounded-lg bg-[#FAF9F6] border border-[#E4E1DA] text-xs text-[#162A43] focus:outline-none focus:border-[#356AE6]"
          >
            <option value="all">All Categories</option>
            <option value="data_engineering">Data Engineering</option>
            <option value="genai_rag">GenAI &amp; RAG</option>
            <option value="sql">SQL &amp; Analytics</option>
            <option value="ml_theory">ML Theory</option>
            <option value="system_design">System Design</option>
          </select>
        </div>
      </div>

      {/* Question Results List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs text-[#667085]">
          <span>Showing {filterResult.questions.length} verified company questions</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-2.5 py-1 rounded bg-[#FAF9F6] border border-[#E4E1DA] disabled:opacity-40 text-[#162A43] hover:bg-[#EFF4FE]"
              >
                Prev
              </button>
              <span className="px-1 text-[#667085]">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-2.5 py-1 rounded bg-[#FAF9F6] border border-[#E4E1DA] disabled:opacity-40 text-[#162A43] hover:bg-[#EFF4FE]"
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
                isExpanded ? "border-[#356AE6] bg-[#FAF9F6] shadow-sm" : "border-[#E4E1DA] bg-[#FFFFFF] hover:border-[#356AE6] shadow-sm"
              }`}
            >
              {/* Card Header */}
              <div
                onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                className="p-4 cursor-pointer flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#EFF4FE] text-[#356AE6] border border-[#D2E0FB]">
                      {q.companyName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#EAF4EE] text-[#2E7D5B] border border-[#C8E4D3]">
                      ✓ {q.provenance.type.replace("_", " ")} ({q.provenance.reportingYear})
                    </span>
                    <span className="text-xs text-[#667085] font-mono">
                      {q.interviewStage.replace(/_/g, " ")}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#162A43] hover:text-[#356AE6] transition-colors">
                    {q.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-[#F0EFEA] border border-[#E4E1DA] text-[#667085] capitalize">
                    {q.difficulty}
                  </span>
                  <span className="text-[#667085] text-sm">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="p-5 border-t border-[#E4E1DA] space-y-4 text-xs">
                  {/* Context & Statement */}
                  <div>
                    <span className="font-bold text-[#667085] uppercase tracking-wider block mb-1">Business Context</span>
                    <p className="text-[#17191C] leading-relaxed">{q.businessContext}</p>
                  </div>

                  <div>
                    <span className="font-bold text-[#667085] uppercase tracking-wider block mb-1">Problem Statement</span>
                    <p className="text-[#17191C] leading-relaxed">{q.problemStatement}</p>
                  </div>

                  {/* Constraints */}
                  <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#E4E1DA]">
                    <span className="font-bold text-[#162A43] block mb-1">Constraints &amp; SLAs:</span>
                    <ul className="list-disc list-inside text-[#667085] space-y-0.5">
                      {q.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Solution Blueprint */}
                  <div className="rounded-lg border border-[#E4E1DA] overflow-hidden bg-[#FFFFFF]">
                    <div className="px-3 py-2 bg-[#F0EFEA] text-[#162A43] font-semibold flex justify-between items-center border-b border-[#E4E1DA]">
                      <span>Optimal Solution Blueprint</span>
                      <span className="text-[#2E7D5B] font-mono font-bold">
                        {q.solutionBlueprint.timeComplexity} | {q.solutionBlueprint.spaceComplexity}
                      </span>
                    </div>
                    <pre className="p-3 text-xs font-mono text-[#1E293B] overflow-x-auto bg-[#FAF9F6]">
                      {q.solutionBlueprint.codeOrQuerySnippet}
                    </pre>
                  </div>

                  {/* Common Pitfalls & Follow-ups */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-[#FDF0F0] border border-[#F5C6C6]">
                      <span className="font-bold text-[#C24141] block mb-1">⚠️ Common Candidate Pitfalls:</span>
                      <ul className="list-disc list-inside text-[#17191C] space-y-1">
                        {q.commonPitfalls.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-lg bg-[#EFF4FE] border border-[#D2E0FB]">
                      <span className="font-bold text-[#356AE6] block mb-1">🎯 Common Follow-Up Questions:</span>
                      <ul className="list-disc list-inside text-[#17191C] space-y-1">
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
                        className="px-4 py-2 rounded-lg bg-[#356AE6] hover:bg-[#2858C7] text-white font-medium text-xs shadow-sm transition-colors"
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
