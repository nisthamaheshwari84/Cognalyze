"use client";

import React, { useState, useEffect } from "react";
import type { CanonicalArenaRoadmap } from "@/lib/skills/ai-data/sequencing-engine";
import type { TopicAssessmentBundle, TopicAssessmentReport } from "@/lib/skills/ai-data/assessment-engine";

interface IntegratedAssessmentsHubProps {
  candidateId: string;
  initialTopicId?: string;
  canonicalRoadmap: CanonicalArenaRoadmap | null;
  onRefreshContext: () => Promise<void>;
  onNavigateTopic: (topicId: string) => void;
}

export default function IntegratedAssessmentsHub({
  candidateId,
  initialTopicId,
  canonicalRoadmap,
  onRefreshContext,
  onNavigateTopic,
}: IntegratedAssessmentsHubProps) {
  const defaultTopicId =
    initialTopicId ||
    canonicalRoadmap?.recommendedNextTopic?.topicId ||
    "py-01-intro-interpreter";

  const [selectedTopicId, setSelectedTopicId] = useState(defaultTopicId);
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced" | "expert">("intermediate");
  const [bundle, setBundle] = useState<TopicAssessmentBundle | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState<TopicAssessmentReport | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/skills/ai-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "get_topic_assessment",
        candidateId,
        topicId: selectedTopicId,
        difficulty,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setReport(null);
        if (d.success && d.assessment) {
          setBundle(d.assessment);
          const init: Record<string, string | string[]> = {};
          for (const it of d.assessment.items) {
            if (it.starterCode) init[it.id] = it.starterCode;
          }
          setAnswers(init);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [candidateId, selectedTopicId, difficulty]);

  const unlockedNodes = (canonicalRoadmap?.subjects || [])
    .flatMap((s) => s.topics)
    .filter((t) => t.lockState !== "LOCKED")
    .slice(0, 24);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_topic_assessment",
          candidateId,
          topicId: selectedTopicId,
          difficulty,
          answers,
        }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
        await onRefreshContext();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-sans">
      <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#6D28D9] bg-[#F5F3FF] px-2.5 py-0.5 rounded">
            Server-Evaluated Mastery Exam
          </span>
          <h1 className="text-xl font-bold text-[#162A43] mt-1">
            Assessments &amp; Targeted Remediation
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Covers MCQ, Multi-Select, Trace Prediction, Scenario, Live Coding Execution &amp; Concept Defense.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="text-xs font-bold border border-[#E4E1DA] rounded-xl px-3 py-2 bg-[#FAF9F6] max-w-[260px]"
          >
            {unlockedNodes.length > 0 ? (
              unlockedNodes.map((n) => (
                <option key={n.topicId} value={n.topicId}>
                  {n.title}
                </option>
              ))
            ) : (
              <option value={defaultTopicId}>{bundle?.topicTitle || defaultTopicId}</option>
            )}
          </select>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as "beginner" | "intermediate" | "advanced" | "expert")}
            className="text-xs font-bold border border-[#E4E1DA] rounded-xl px-3 py-2 bg-[#FAF9F6]"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>
      </div>

      {bundle && (
        <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            {bundle.transparentRubric.map((r) => (
              <div key={r.format} className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#E4E1DA]">
                <div className="font-bold text-[#162A43]">{r.format} ({r.weightPercent}%)</div>
                <div className="text-stone-500 line-clamp-2">{r.criteria}</div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {bundle.items.map((item, idx) => (
              <div key={item.id} className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E4E1DA] space-y-2.5">
                <div className="flex items-center justify-between text-[10.5px] font-bold text-[#6D28D9]">
                  <span>Q{idx + 1} • {item.format.replace(/_/g, " ").toUpperCase()} • {item.conceptTag}</span>
                  <span>{item.weightPoints} pts</span>
                </div>
                <p className="text-xs font-bold text-[#162A43]">{item.prompt}</p>
                {item.codeSnippet && (
                  <pre className="p-2.5 rounded-lg bg-white border border-[#E4E1DA] font-mono text-[11px] overflow-x-auto">
                    {item.codeSnippet}
                  </pre>
                )}

                {(item.format === "mcq" || item.format === "scenario") && item.options && (
                  <div className="space-y-1.5">
                    {item.options.map((opt) => (
                      <label key={opt.id} className="flex items-start gap-2 p-2 rounded-lg border bg-white border-[#E4E1DA] text-xs cursor-pointer">
                        <input
                          type="radio"
                          name={`hub-${item.id}`}
                          checked={answers[item.id] === opt.id}
                          onChange={() => setAnswers((p) => ({ ...p, [item.id]: opt.id }))}
                        />
                        <span>{opt.text}</span>
                      </label>
                    ))}
                  </div>
                )}

                {item.format === "multi_select" && item.options && (
                  <div className="space-y-1.5">
                    {item.options.map((opt) => {
                      const arr = Array.isArray(answers[item.id]) ? (answers[item.id] as string[]) : [];
                      const checked = arr.includes(opt.id);
                      return (
                        <label key={opt.id} className="flex items-start gap-2 p-2 rounded-lg border bg-white border-[#E4E1DA] text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = checked ? arr.filter((x) => x !== opt.id) : [...arr, opt.id];
                              setAnswers((p) => ({ ...p, [item.id]: next }));
                            }}
                          />
                          <span>{opt.text}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {item.format === "output_prediction" && (
                  <input
                    type="text"
                    placeholder="Enter exact predicted output..."
                    value={String(answers[item.id] || "")}
                    onChange={(e) => setAnswers((p) => ({ ...p, [item.id]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-[#E4E1DA] bg-white font-mono text-xs"
                  />
                )}

                {(item.format === "coding" || item.format === "debugging") && (
                  <textarea
                    rows={6}
                    value={String(answers[item.id] ?? item.starterCode ?? "")}
                    onChange={(e) => setAnswers((p) => ({ ...p, [item.id]: e.target.value }))}
                    className="w-full p-3 rounded-lg border border-[#CBD5E1] bg-white font-mono text-xs"
                  />
                )}

                {(item.format === "viva" || item.format === "short_answer") && (
                  <textarea
                    rows={3}
                    placeholder="Explain how this works internally..."
                    value={String(answers[item.id] || "")}
                    onChange={(e) => setAnswers((p) => ({ ...p, [item.id]: e.target.value }))}
                    className="w-full p-3 rounded-lg border border-[#E4E1DA] bg-white text-xs"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold rounded-xl"
            >
              {submitting ? "Evaluating..." : "Submit & Record Assessment"}
            </button>
            <button
              onClick={() => onNavigateTopic(selectedTopicId)}
              className="text-xs font-bold text-[#162A43] hover:underline"
            >
              Review Topic Lesson →
            </button>
          </div>

          {report && (
            <div className={`p-4 rounded-xl border text-xs space-y-2 ${report.passed ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="font-bold text-sm text-[#162A43]">
                Final Score: {report.scorePercent}% — {report.passed ? "PASSED" : "Remediation Triggered"}
              </div>
              {report.remediationPlan.map((rem, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-white border border-amber-200">
                  <strong>{rem.concept}:</strong> {rem.targetedExercise}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
