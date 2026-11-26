"use client";

import React, { useState, useEffect } from "react";
import type { PracticalLabSpec, PracticalLabEvaluation } from "@/lib/skills/ai-data/practical-lab-engine";

interface PracticalLabsHubProps {
  candidateId: string;
  initialTopicId?: string;
  onRefreshContext: () => Promise<void>;
  onNavigateTopic: (topicId: string) => void;
}

export default function PracticalLabsHub({
  candidateId,
  initialTopicId,
  onRefreshContext,
  onNavigateTopic,
}: PracticalLabsHubProps) {
  const [labs, setLabs] = useState<PracticalLabSpec[]>([]);
  const [selectedLab, setSelectedLab] = useState<PracticalLabSpec | null>(null);
  const [code, setCode] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<PracticalLabEvaluation | null>(null);

  useEffect(() => {
    async function load() {
      const listRes = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_practical_lab", candidateId }),
      }).then((r) => r.json());
      const allLabs: PracticalLabSpec[] = listRes.labs || [];
      setLabs(allLabs);

      if (initialTopicId) {
        const specRes = await fetch("/api/skills/ai-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get_practical_lab", candidateId, topicId: initialTopicId }),
        }).then((r) => r.json());
        if (specRes.lab) {
          setSelectedLab(specRes.lab);
          setCode(specRes.lab.starterCode);
          return;
        }
      }
      if (allLabs[0]) {
        setSelectedLab(allLabs[0]);
        setCode(allLabs[0].starterCode);
      }
    }
    load();
  }, [candidateId, initialTopicId]);

  const handleEvaluate = async () => {
    if (!selectedLab) return;
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_practical_lab",
          candidateId,
          topicId: selectedLab.topicId,
          submissionText: code,
        }),
      });
      const data = await res.json();
      if (data.success && data.evaluation) {
        setResult(data.evaluation);
        await onRefreshContext();
      }
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      <div className="lg:col-span-4 space-y-2.5">
        <div className="bg-white border border-[#E4E1DA] rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-[#162A43]">Practical Laboratories</h2>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Real Python, SQLite, Data Cleaning, and ML Model Training Labs evaluated server-side.
          </p>
        </div>
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {labs.map((lab) => {
            const active = selectedLab?.id === lab.id;
            return (
              <button
                key={lab.id}
                onClick={() => {
                  setSelectedLab(lab);
                  setCode(lab.starterCode);
                  setResult(null);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition ${
                  active ? "bg-[#F5F3FF] border-[#6D28D9]" : "bg-white border-[#E4E1DA] hover:border-stone-400"
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-[#6D28D9]">{lab.labType.replace(/_/g, " ")}</div>
                <div className="text-xs font-bold text-[#162A43] mt-0.5">{lab.title}</div>
                <div className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">{lab.objective}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-8">
        {selectedLab ? (
          <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#F5F3FF] text-[#6D28D9]">
                  {selectedLab.labType.replace(/_/g, " ")}
                </span>
                <h2 className="text-lg font-bold text-[#162A43] mt-1">{selectedLab.title}</h2>
              </div>
              <button
                onClick={() => onNavigateTopic(selectedLab.topicId)}
                className="text-xs font-bold text-[#6D28D9] hover:underline"
              >
                Study Connected Concept →
              </button>
            </div>
            <p className="text-xs text-stone-700">{selectedLab.objective}</p>
            {selectedLab.datasetSummary && (
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E4E1DA] text-xs text-stone-700">
                <strong>Schema / Input:</strong> {selectedLab.datasetSummary}
              </div>
            )}
            <ul className="list-disc pl-5 text-xs text-stone-700 space-y-1">
              {selectedLab.instructions.map((ins, i) => (
                <li key={i}>{ins}</li>
              ))}
            </ul>
            <textarea
              rows={11}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-[#CBD5E1] bg-[#FAF9F6] font-mono text-xs text-[#162A43]"
            />
            <button
              onClick={handleEvaluate}
              disabled={running}
              className="px-5 py-2.5 bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold rounded-xl"
            >
              {running ? "Executing Automated Assertions..." : "Run & Verify Practical Lab ▶"}
            </button>

            {result && (
              <div className={`p-4 rounded-xl border text-xs space-y-2 ${result.passed ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-amber-50 border-amber-200 text-amber-900"}`}>
                <div className="font-bold">{result.passed ? "✓ PASSED" : "Needs Refinement"} — Score: {result.score}%</div>
                <div>{result.feedback}</div>
                {result.stdout && <pre className="font-mono text-[11px] whitespace-pre-wrap">{result.stdout}</pre>}
                {result.stderr && <pre className="font-mono text-[11px] text-rose-700 whitespace-pre-wrap">{result.stderr}</pre>}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-[#E4E1DA] rounded-2xl p-8 text-center text-xs text-stone-500">
            Loading practical laboratories...
          </div>
        )}
      </div>
    </div>
  );
}
