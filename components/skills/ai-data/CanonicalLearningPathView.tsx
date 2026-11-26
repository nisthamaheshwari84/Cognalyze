"use client";

import React, { useState, useEffect } from "react";
import { TargetRoleSlug } from "@/lib/skills/ai-data/types";
import { getAllTargetRoles } from "@/lib/skills/ai-data/roles";
import { TAXONOMY_SUBJECTS } from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import type { CanonicalArenaRoadmap } from "@/lib/skills/ai-data/sequencing-engine";
import type { BaselineDiagnosticQuestion, BaselineAssessmentResult } from "@/lib/skills/ai-data/baseline-assessment-engine";

interface CanonicalLearningPathViewProps {
  candidateId: string;
  activeRole: TargetRoleSlug;
  canonicalRoadmap: CanonicalArenaRoadmap | null;
  onSelectRole: (role: TargetRoleSlug) => void;
  onSelectTopic: (topicId: string) => void;
  onRefreshContext: () => Promise<void>;
}

export default function CanonicalLearningPathView({
  candidateId,
  activeRole,
  canonicalRoadmap,
  onSelectRole,
  onSelectTopic,
  onRefreshContext,
}: CanonicalLearningPathViewProps) {
  const allRoles = getAllTargetRoles();
  const [diagOpen, setDiagOpen] = useState(false);
  const [diagQuestions, setDiagQuestions] = useState<BaselineDiagnosticQuestion[]>([]);
  const [diagAnswers, setDiagAnswers] = useState<Record<string, string>>({});
  const [startingLevel, setStartingLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [diagResult, setDiagResult] = useState<BaselineAssessmentResult | null>(null);
  const [submittingDiag, setSubmittingDiag] = useState(false);

  const [customOpen, setCustomOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customSubjects, setCustomSubjects] = useState<string[]>(["subj_python", "subj_sql", "subj_ml"]);

  useEffect(() => {
    if (!diagOpen || diagQuestions.length > 0) return;
    fetch("/api/skills/ai-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_baseline_questions", candidateId }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.questions)) setDiagQuestions(d.questions);
      })
      .catch(() => {});
  }, [diagOpen, diagQuestions.length, candidateId]);

  const handleSubmitDiagnostic = async () => {
    setSubmittingDiag(true);
    try {
      const responses = Object.entries(diagAnswers).map(([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
        timeSpentSeconds: 20,
      }));
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_baseline_assessment",
          candidateId,
          targetRole: activeRole,
          startingLevel,
          responses,
        }),
      });
      const data = await res.json();
      if (data.success && data.evaluation) {
        setDiagResult(data.evaluation);
        await onRefreshContext();
      }
    } finally {
      setSubmittingDiag(false);
    }
  };

  const handleSaveCustomTarget = async () => {
    if (!customTitle.trim() || customSubjects.length === 0) return;
    await fetch("/api/skills/ai-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "set_custom_target_role",
        candidateId,
        title: customTitle.trim(),
        requiredSubjectIds: customSubjects,
      }),
    });
    setCustomOpen(false);
    await onRefreshContext();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-sans">
      {/* Header & Target Selection */}
      <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#6D28D9] bg-[#F5F3FF] border border-[#DDD6FE] px-2.5 py-0.5 rounded">
              Prerequisite-Aware Learning Path
            </span>
            <h1 className="text-xl font-bold text-[#162A43] mt-1">
              {canonicalRoadmap?.roleTitle || "AI Engineer"} — Sequential Dependency Graph
            </h1>
            <p className="text-xs text-stone-600 mt-1 max-w-2xl">
              {canonicalRoadmap?.roleSummary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setDiagOpen((v) => !v)}
              className="px-4 py-2 bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              {diagOpen ? "Close Diagnostic" : "Take Initial Skill Diagnostic"}
            </button>
            <button
              onClick={() => setCustomOpen((v) => !v)}
              className="px-3.5 py-2 bg-white border border-[#E4E1DA] hover:border-stone-400 text-[#162A43] text-xs font-bold rounded-xl transition"
            >
              Configure Custom Target
            </button>
          </div>
        </div>

        {/* 10 Supported Targets Strip */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-stone-100">
          {allRoles.map((role) => {
            const active = role.slug === activeRole;
            return (
              <button
                key={role.slug}
                onClick={() => onSelectRole(role.slug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                  active
                    ? "bg-[#162A43] text-white border-[#162A43]"
                    : "bg-[#FAF9F6] text-stone-700 border-[#E4E1DA] hover:border-[#6D28D9]"
                }`}
              >
                {role.icon} {role.title}
              </button>
            );
          })}
        </div>

        {/* Verified vs Missing Competency Chips */}
        {canonicalRoadmap && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E4E1DA]">
              <div className="font-bold text-stone-500 uppercase text-[10px]">Required Competencies</div>
              <div className="mt-1 text-[#162A43] font-semibold">
                {canonicalRoadmap.requiredCompetencies.map((c) => c.replace(/_/g, " ")).join(" • ")}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="font-bold text-emerald-800 uppercase text-[10px]">Verified / Exempted</div>
              <div className="mt-1 text-emerald-900 font-semibold">
                {canonicalRoadmap.verifiedCompetencies.length > 0
                  ? canonicalRoadmap.verifiedCompetencies.map((c) => c.replace(/_/g, " ")).join(" • ")
                  : "None yet — complete diagnostic or assessments."}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
              <div className="font-bold text-amber-800 uppercase text-[10px]">Missing Prerequisite Gates</div>
              <div className="mt-1 text-amber-900 font-semibold">
                {canonicalRoadmap.missingPrerequisites.length > 0
                  ? canonicalRoadmap.missingPrerequisites.join(" • ")
                  : "Current stage prerequisites met."}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Target Configurator */}
      {customOpen && (
        <div className="bg-white border border-[#DDD6FE] rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#162A43]">Configure Custom Career Target</h3>
          <input
            type="text"
            placeholder="Target Role Title (e.g. Healthcare AI Research Engineer)"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[#E4E1DA] bg-[#FAF9F6]"
          />
          <div className="flex flex-wrap gap-2">
            {TAXONOMY_SUBJECTS.map((s) => {
              const checked = customSubjects.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() =>
                    setCustomSubjects((prev) =>
                      prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]
                    )
                  }
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                    checked ? "bg-[#F5F3FF] border-[#6D28D9] text-[#5B21B6]" : "bg-white border-[#E4E1DA] text-stone-600"
                  }`}
                >
                  {checked ? "✓ " : ""}{s.title}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleSaveCustomTarget}
            className="px-4 py-2 bg-[#6D28D9] text-white text-xs font-bold rounded-xl"
          >
            Save Custom Target Roadmap
          </button>
        </div>
      )}

      {/* Initial Structured Diagnostic Panel */}
      {diagOpen && (
        <div className="bg-white border border-[#DDD6FE] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#162A43]">
                Initial Diagnostic Calibration (Evidence-Gated Exemptions)
              </h2>
              <p className="text-xs text-stone-600">
                Prove competence in fundamentals (Programming, Python, Math, DSA, SQL, Pandas, ML) to calibrate your exact starting point.
              </p>
            </div>
            <select
              value={startingLevel}
              onChange={(e) => setStartingLevel(e.target.value as "beginner" | "intermediate" | "advanced")}
              className="text-xs font-bold border border-[#E4E1DA] rounded-lg px-3 py-1.5 bg-[#FAF9F6]"
            >
              <option value="beginner">Background: Beginner</option>
              <option value="intermediate">Background: Intermediate</option>
              <option value="advanced">Background: Experienced Engineer</option>
            </select>
          </div>

          <div className="space-y-4">
            {diagQuestions.map((q, idx) => (
              <div key={q.id} className="p-4 rounded-xl border border-[#E4E1DA] bg-[#FAF9F6] space-y-2.5">
                <div className="flex items-center justify-between text-[10.5px] font-bold text-[#6D28D9]">
                  <span>Q{idx + 1} • {q.skillName}</span>
                  <span className="uppercase">{q.difficulty}</span>
                </div>
                <p className="text-xs font-semibold text-[#162A43]">{q.prompt}</p>
                {q.codeSnippet && (
                  <pre className="p-2.5 rounded-lg bg-white border border-[#E4E1DA] text-[11px] font-mono overflow-x-auto">
                    {q.codeSnippet}
                  </pre>
                )}
                <div className="space-y-1.5">
                  {q.options.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                        diagAnswers[q.id] === opt.id
                          ? "bg-[#F5F3FF] border-[#6D28D9] text-[#162A43]"
                          : "bg-white border-[#E4E1DA] text-stone-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={diagAnswers[q.id] === opt.id}
                        onChange={() => setDiagAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                      />
                      <span>{opt.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleSubmitDiagnostic}
              disabled={submittingDiag || diagQuestions.length === 0}
              className="px-5 py-2.5 bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold rounded-xl transition"
            >
              {submittingDiag ? "Evaluating Baseline..." : "Submit Diagnostic & Recalibrate Path"}
            </button>
          </div>

          {diagResult && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
              <div className="font-bold text-emerald-900">
                Diagnostic Score: {diagResult.overallScorePercent}% ({diagResult.correctCount}/{diagResult.totalQuestions})
              </div>
              <p className="text-emerald-800">{diagResult.diagnosticSummary}</p>
              {diagResult.exemptionsGranted.length > 0 && (
                <div className="font-semibold text-emerald-900">
                  Verified Prerequisite Exemptions Granted: {diagResult.exemptionsGranted.join(", ")}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sequential Subject & Topic Dependency DAG */}
      <div className="space-y-4">
        {(canonicalRoadmap?.subjects || []).map((subj, sIdx) => (
          <div key={subj.subjectId} className="bg-white border border-[#E4E1DA] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-400">STAGE {sIdx + 1}</span>
                  <h3 className="text-sm font-bold text-[#162A43]">{subj.icon} {subj.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${subj.isUnlocked ? "bg-[#F5F3FF] text-[#6D28D9]" : "bg-stone-200 text-stone-600"}`}>
                    {subj.isUnlocked ? "UNLOCKED" : "LOCKED"}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">{subj.roleWhy}</p>
              </div>
              <div className="text-xs font-bold text-[#162A43] shrink-0">
                {subj.completedTopics}/{subj.totalTopics} Verified ({subj.percentMastered}%)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {subj.topics.slice(0, 12).map((node) => {
                const locked = node.lockState === "LOCKED";
                const mastered = node.lockState === "MASTERED" || node.lockState === "COMPLETED";
                const rem = node.lockState === "REMEDIATION_REQUIRED";

                return (
                  <button
                    key={node.topicId}
                    onClick={() => {
                      if (!locked) onSelectTopic(node.topicId);
                    }}
                    disabled={locked}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 ${
                      mastered
                        ? "bg-emerald-50/50 border-emerald-200 hover:border-emerald-400"
                        : rem
                        ? "bg-amber-50 border-amber-300"
                        : locked
                        ? "bg-[#FAF9F6] border-[#E4E1DA] opacity-70 cursor-not-allowed"
                        : "bg-white border-[#DDD6FE] hover:border-[#6D28D9]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-[#162A43] line-clamp-2">{node.title}</span>
                      <span className="text-[10px] shrink-0 font-bold">
                        {mastered ? "✓" : rem ? "⚠" : locked ? "🔒" : "▶"}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-500">
                      {locked
                        ? node.lockReason
                        : rem
                        ? `Remediation needed (${node.assessmentScore ?? 0}%)`
                        : mastered
                        ? node.masteryStatus.replace(/_/g, " ")
                        : `Ready • ${node.difficulty}`}
                    </div>
                  </button>
                );
              })}
            </div>
            {subj.topics.length > 12 && (
              <div className="text-[11px] text-stone-500">
                Showing first 12 sequential topics in {subj.title} — open the Learn sidebar to browse all {subj.topics.length} topics cleanly.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
