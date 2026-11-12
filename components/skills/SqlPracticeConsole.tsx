"use client";

import React, { useState, useEffect } from "react";
import { CANONICAL_SQL_PROBLEMS, SqlProblemDefinition, SqlRunResult } from "@/lib/skills/sql-canonical-problems";
import { Terminal, Play, Send, CheckCircle2, XCircle, AlertTriangle, Lightbulb, Database } from "lucide-react";

interface SqlPracticeConsoleProps {
  initialProblemId?: string;
  onSuccess?: (problemId: string) => void;
}

export default function SqlPracticeConsole({ initialProblemId = "second-highest-salary", onSuccess }: SqlPracticeConsoleProps) {
  const [selectedProblemId, setSelectedProblemId] = useState(initialProblemId);
  const problem: SqlProblemDefinition = CANONICAL_SQL_PROBLEMS[selectedProblemId] || CANONICAL_SQL_PROBLEMS["second-highest-salary"];
  
  const [userQuery, setUserQuery] = useState(problem.referenceSolution);
  const [executing, setExecuting] = useState(false);
  const [runResult, setRunResult] = useState<SqlRunResult | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [showSchema, setShowSchema] = useState(true);

  useEffect(() => {
    setUserQuery(problem.referenceSolution);
    setRunResult(null);
  }, [selectedProblemId, problem]);

  const handleRun = async (isSubmit = false) => {
    setExecuting(true);
    try {
      const res = await fetch("/api/skills/sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isSubmit ? "submit" : "run",
          problemId: selectedProblemId,
          query: userQuery
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setRunResult(data.result);
        if (data.result.allPassed && onSuccess) {
          onSuccess(selectedProblemId);
        }
      }
    } catch (err) {
      console.error("SQL Run Failed:", err);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E4E1DA] rounded-xl overflow-hidden shadow-sm text-[#17191C]">
      {/* Header & Problem Selector */}
      <div className="p-5 border-b border-[#E4E1DA] bg-[#FAF9F6] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF4FE] border border-[#D2E0FB] flex items-center justify-center text-[#356AE6]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#162A43]">{problem.title}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                problem.difficulty === "Easy" ? "bg-[#EAF4EE] text-[#2E7D5B] border border-[#C8E4D3]" :
                problem.difficulty === "Medium" ? "bg-[#FEF7ED] text-[#B7791F] border border-[#F8D8A7]" :
                "bg-[#FDF0F0] text-[#C24141] border border-[#F5C6C6]"
              }`}>
                {problem.difficulty}
              </span>
              <span className="text-xs text-[#667085] bg-[#FFFFFF] px-2 py-0.5 rounded-md border border-[#E4E1DA]">
                {problem.topic}
              </span>
            </div>
            <p className="text-xs text-[#667085] mt-0.5">Real In-Memory Relational Engine (SQLite DatabaseSync)</p>
          </div>
        </div>

        {/* Problem Picker */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#667085] font-semibold">Select Problem:</label>
          <select
            value={selectedProblemId}
            onChange={(e) => setSelectedProblemId(e.target.value)}
            className="bg-[#FFFFFF] border border-[#E4E1DA] rounded-lg px-3 py-1.5 text-xs text-[#162A43] focus:outline-none focus:border-[#356AE6]"
          >
            {Object.values(CANONICAL_SQL_PROBLEMS).map(p => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.difficulty})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E4E1DA]">
        {/* Left Column: Problem Statement & Schema */}
        <div className="lg:col-span-5 p-6 space-y-6 overflow-y-auto max-h-[750px] bg-[#FFFFFF]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-2">Description</h3>
            <div className="text-sm text-[#17191C] leading-relaxed whitespace-pre-line bg-[#FAF9F6] p-4 rounded-xl border border-[#E4E1DA]">
              {problem.description}
            </div>
          </div>

          {/* Table Schema Viewer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085]">Relational Schema</h3>
              <button
                onClick={() => setShowSchema(!showSchema)}
                className="text-xs text-[#356AE6] hover:text-[#2858C7] font-semibold transition"
              >
                {showSchema ? "Collapse" : "Expand"}
              </button>
            </div>
            {showSchema && (
              <div className="bg-[#FAF9F6] p-3.5 rounded-xl border border-[#E4E1DA] text-xs font-mono text-[#1E293B] whitespace-pre overflow-x-auto">
                {problem.schemaDdl}
              </div>
            )}
          </div>

          {/* Collapsible Hints */}
          <div>
            <button
              onClick={() => setShowHints(!showHints)}
              className="flex items-center gap-2 text-xs font-semibold text-[#B7791F] hover:text-[#975A16] transition"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              {showHints ? "Hide Hints" : `Need a hint? (${problem.hints.length} available)`}
            </button>
            {showHints && (
              <div className="mt-3 space-y-2 bg-[#FEF7ED] border border-[#F8D8A7] p-3.5 rounded-xl">
                {problem.hints.map((h, i) => (
                  <p key={i} className="text-xs text-[#B7791F] leading-relaxed">
                    • {h}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: SQL Editor & Test Results */}
        <div className="lg:col-span-7 flex flex-col bg-[#FFFFFF]">
          {/* Editor Header */}
          <div className="px-5 py-3 border-b border-[#E4E1DA] bg-[#FAF9F6] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#162A43] font-mono font-semibold">
              <Terminal className="w-4 h-4 text-[#356AE6]" />
              <span>query.sql</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUserQuery(problem.referenceSolution)}
                className="text-xs text-[#667085] hover:text-[#162A43] px-2.5 py-1 rounded bg-[#FFFFFF] border border-[#E4E1DA] transition"
              >
                Reset
              </button>
              <button
                onClick={() => handleRun(false)}
                disabled={executing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#FFFFFF] hover:bg-[#EFF4FE] text-[#162A43] border border-[#E4E1DA] transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 text-[#356AE6]" />
                Run Query
              </button>
              <button
                onClick={() => handleRun(true)}
                disabled={executing}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#356AE6] hover:bg-[#2858C7] text-white shadow-sm transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Solution
              </button>
            </div>
          </div>

          {/* SQL Input Area */}
          <div className="p-4 flex-1 bg-[#FFFFFF]">
            <textarea
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              rows={10}
              placeholder="SELECT ... FROM ..."
              className="w-full bg-[#FAF9F6] border border-[#E4E1DA] rounded-xl p-4 font-mono text-sm text-[#1E293B] focus:bg-[#FFFFFF] focus:outline-none focus:border-[#356AE6] transition leading-relaxed resize-y"
              spellCheck={false}
            />
          </div>

          {/* Output & Test Runner Results */}
          <div className="p-5 border-t border-[#E4E1DA] bg-[#FAF9F6] min-h-[220px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#667085]">Execution Output</span>
                {runResult && (
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    runResult.allPassed ? "bg-[#EAF4EE] text-[#2E7D5B] border border-[#C8E4D3]" :
                    runResult.status === "syntax_error" ? "bg-[#FDF0F0] text-[#C24141] border border-[#F5C6C6]" :
                    "bg-[#FEF7ED] text-[#B7791F] border border-[#F8D8A7]"
                  }`}>
                    {runResult.status.toUpperCase()} ({runResult.passedCount}/{runResult.totalCount} Passed)
                  </span>
                )}
              </div>
              {runResult && (
                <span className="text-xs text-[#667085] font-mono">
                  {runResult.overallTimeMs} ms
                </span>
              )}
            </div>

            {/* Error Message banner */}
            {runResult && runResult.error && (
              <div className="mb-3 p-3 rounded-xl bg-[#FDF0F0] border border-[#F5C6C6] text-xs text-[#C24141] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#C24141]" />
                <span>{runResult.error}</span>
              </div>
            )}

            {/* Individual test case results */}
            {runResult ? (
              <div className="space-y-3">
                {runResult.outcomes.map((tc, idx) => (
                  <div key={idx} className={`p-3.5 rounded-xl border text-xs bg-[#FFFFFF] ${
                    tc.passed ? "border-[#C8E4D3]" : "border-[#F5C6C6]"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {tc.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-[#2E7D5B]" />
                        ) : (
                          <XCircle className="w-4 h-4 text-[#C24141]" />
                        )}
                        <span className="font-semibold text-[#162A43]">Test Case #{idx + 1} ({tc.testCaseId})</span>
                      </div>
                      <span className="text-[#667085] font-mono text-[11px]">{tc.executionTimeMs} ms</span>
                    </div>

                    {tc.errorMessage && (
                      <p className="text-[#C24141] font-mono text-[11px] mt-1 bg-[#FDF0F0] p-2 rounded border border-[#F5C6C6]">
                        {tc.errorMessage}
                      </p>
                    )}

                    {tc.actualRows && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                        <div>
                          <div className="text-[#667085] mb-1 font-sans font-medium">Actual Output:</div>
                          <div className="bg-[#FAF9F6] border border-[#E4E1DA] p-2 rounded overflow-x-auto max-h-24 text-[#1E293B]">
                            {JSON.stringify(tc.actualRows, null, 2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[#667085] mb-1 font-sans font-medium">Expected Output:</div>
                          <div className="bg-[#FAF9F6] border border-[#E4E1DA] p-2 rounded overflow-x-auto max-h-24 text-[#2E7D5B]">
                            {JSON.stringify(tc.expectedRows, null, 2)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-[#667085] text-xs">
                <Terminal className="w-8 h-8 text-[#98A2B3] mb-2" />
                <p>Click &ldquo;Run Query&rdquo; or &ldquo;Submit Solution&rdquo; to test your SQL logic against real database tables.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
