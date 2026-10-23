"use client";

import React, { useState, useEffect } from "react";
import { CANONICAL_SQL_PROBLEMS, SqlProblemDefinition, SqlRunResult } from "@/lib/skills/sql-canonical-problems";
import { Terminal, Play, Send, CheckCircle2, XCircle, AlertTriangle, Lightbulb, Database, Sparkles, RefreshCw } from "lucide-react";

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
    <div className="bg-[#0e131f] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header & Problem Selector */}
      <div className="p-5 border-b border-gray-800/80 bg-[#141b2d]/70 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{problem.title}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                problem.difficulty === "Easy" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                problem.difficulty === "Medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}>
                {problem.difficulty}
              </span>
              <span className="text-xs text-gray-400 bg-gray-800/60 px-2 py-0.5 rounded-md border border-gray-700/50">
                {problem.topic}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Real In-Memory Relational Engine (SQLite DatabaseSync)</p>
          </div>
        </div>

        {/* Problem Picker */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Select Problem:</label>
          <select
            value={selectedProblemId}
            onChange={(e) => setSelectedProblemId(e.target.value)}
            className="bg-[#0b0f19] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
          >
            {Object.values(CANONICAL_SQL_PROBLEMS).map(p => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.difficulty})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-800/80">
        {/* Left Column: Problem Statement & Schema */}
        <div className="lg:col-span-5 p-6 space-y-6 overflow-y-auto max-h-[750px]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Description</h3>
            <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line bg-gray-900/40 p-4 rounded-xl border border-gray-800/60">
              {problem.description}
            </div>
          </div>

          {/* Table Schema Viewer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Relational Schema</h3>
              <button
                onClick={() => setShowSchema(!showSchema)}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition"
              >
                {showSchema ? "Collapse" : "Expand"}
              </button>
            </div>
            {showSchema && (
              <div className="bg-[#080c14] p-3.5 rounded-xl border border-gray-800 text-xs font-mono text-cyan-300/90 whitespace-pre overflow-x-auto">
                {problem.schemaDdl}
              </div>
            )}
          </div>

          {/* Collapsible Hints */}
          <div>
            <button
              onClick={() => setShowHints(!showHints)}
              className="flex items-center gap-2 text-xs font-medium text-amber-400 hover:text-amber-300 transition"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              {showHints ? "Hide Hints" : `Need a hint? (${problem.hints.length} available)`}
            </button>
            {showHints && (
              <div className="mt-3 space-y-2 bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-xl">
                {problem.hints.map((h, i) => (
                  <p key={i} className="text-xs text-amber-200/90 leading-relaxed">
                    • {h}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: SQL Editor & Test Results */}
        <div className="lg:col-span-7 flex flex-col bg-[#0b0f19]">
          {/* Editor Header */}
          <div className="px-5 py-3 border-b border-gray-800/80 bg-[#101626] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-300 font-mono">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>query.sql</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUserQuery(problem.referenceSolution)}
                className="text-xs text-gray-400 hover:text-gray-200 px-2.5 py-1 rounded bg-gray-800/50 border border-gray-700/50 transition"
              >
                Reset
              </button>
              <button
                onClick={() => handleRun(false)}
                disabled={executing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 text-cyan-400" />
                Run Query
              </button>
              <button
                onClick={() => handleRun(true)}
                disabled={executing}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Solution
              </button>
            </div>
          </div>

          {/* SQL Input Area */}
          <div className="p-4 flex-1">
            <textarea
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              rows={10}
              placeholder="SELECT ... FROM ..."
              className="w-full bg-[#080c14] border border-gray-800/90 rounded-xl p-4 font-mono text-sm text-cyan-200 focus:outline-none focus:border-cyan-500 transition leading-relaxed resize-y"
              spellCheck={false}
            />
          </div>

          {/* Output & Test Runner Results */}
          <div className="p-5 border-t border-gray-800 bg-[#0c101c] min-h-[220px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Execution Output</span>
                {runResult && (
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    runResult.allPassed ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    runResult.status === "syntax_error" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                    "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                    {runResult.status.toUpperCase()} ({runResult.passedCount}/{runResult.totalCount} Passed)
                  </span>
                )}
              </div>
              {runResult && (
                <span className="text-xs text-gray-500 font-mono">
                  {runResult.overallTimeMs} ms
                </span>
              )}
            </div>

            {/* Error Message banner */}
            {runResult && runResult.error && (
              <div className="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{runResult.error}</span>
              </div>
            )}

            {/* Individual test case results */}
            {runResult ? (
              <div className="space-y-3">
                {runResult.outcomes.map((tc, idx) => (
                  <div key={idx} className={`p-3.5 rounded-xl border text-xs ${
                    tc.passed ? "bg-emerald-950/20 border-emerald-800/40" : "bg-rose-950/20 border-rose-800/40"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {tc.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                        <span className="font-semibold text-gray-200">Test Case #{idx + 1} ({tc.testCaseId})</span>
                      </div>
                      <span className="text-gray-500 font-mono text-[11px]">{tc.executionTimeMs} ms</span>
                    </div>

                    {tc.errorMessage && (
                      <p className="text-rose-400 font-mono text-[11px] mt-1 bg-black/40 p-2 rounded">
                        {tc.errorMessage}
                      </p>
                    )}

                    {tc.actualRows && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                        <div>
                          <div className="text-gray-400 mb-1 font-sans font-medium">Actual Output:</div>
                          <div className="bg-black/50 p-2 rounded overflow-x-auto max-h-24 text-gray-300">
                            {JSON.stringify(tc.actualRows, null, 2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 mb-1 font-sans font-medium">Expected Output:</div>
                          <div className="bg-black/50 p-2 rounded overflow-x-auto max-h-24 text-emerald-300/80">
                            {JSON.stringify(tc.expectedRows, null, 2)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500 text-xs">
                <Terminal className="w-8 h-8 text-gray-600 mb-2" />
                <p>Click "Run Query" or "Submit Solution" to test your SQL logic against real database tables.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
