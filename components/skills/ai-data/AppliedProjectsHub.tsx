"use client";

import React, { useState, useEffect } from "react";
import type { IntegratedProjectSpec } from "@/lib/skills/ai-data/projects-engine";

interface AppliedProjectsHubProps {
  candidateId: string;
  onBackToOverview?: () => void;
  onLaunchStudio?: (studioId: string) => void;
  onRefreshContext?: () => Promise<void>;
}

type ProjectWithLock = IntegratedProjectSpec & {
  isUnlocked: boolean;
  missingPrerequisites: string[];
};

export default function AppliedProjectsHub({
  candidateId,
  onBackToOverview,
  onRefreshContext,
}: AppliedProjectsHubProps) {
  const [projects, setProjects] = useState<ProjectWithLock[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [activeMilestoneIdx, setActiveMilestoneIdx] = useState<number>(0);
  const [codeByMilestone, setCodeByMilestone] = useState<Record<string, string>>({});
  const [hintTierByMilestone, setHintTierByMilestone] = useState<Record<string, number>>({});
  const [verifying, setVerifying] = useState(false);
  const [milestoneResult, setMilestoneResult] = useState<{ passed: boolean; score: number; feedback: string; stdout?: string; stderr?: string } | null>(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [repoResult, setRepoResult] = useState<{ verified: boolean; reason: string } | null>(null);

  useEffect(() => {
    fetch("/api/skills/ai-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_integrated_projects", candidateId }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.projects)) {
          setProjects(d.projects);
          if (d.projects[0]) setSelectedId(d.projects[0].id);
        }
      })
      .catch(() => {});
  }, [candidateId]);

  const activeProject = projects.find((p) => p.id === selectedId) || projects[0];
  const activeMilestone = activeProject?.milestones?.[activeMilestoneIdx] || activeProject?.milestones?.[0];

  const handleVerifyMilestone = async () => {
    if (!activeProject || !activeMilestone) return;
    setVerifying(true);
    setMilestoneResult(null);
    try {
      const code = codeByMilestone[activeMilestone.id] ?? activeMilestone.starterCode;
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_project_milestone",
          candidateId,
          projectId: activeProject.id,
          milestoneId: activeMilestone.id,
          userCode: code,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setMilestoneResult(data.result);
        if (data.result.passed && onRefreshContext) await onRefreshContext();
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyGithub = async () => {
    if (!activeProject || !repoUrl.trim()) return;
    setRepoResult(null);
    const res = await fetch("/api/skills/ai-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "verify_project_github",
        candidateId,
        projectId: activeProject.id,
        repoUrl: repoUrl.trim(),
      }),
    });
    const data = await res.json();
    if (data.result) {
      setRepoResult(data.result);
      if (data.result.verified && onRefreshContext) await onRefreshContext();
    }
  };

  if (!activeProject) {
    return (
      <div className="bg-white border border-[#E4E1DA] rounded-2xl p-8 text-center text-xs text-stone-500">
        Loading curriculum-integrated progressive projects...
      </div>
    );
  }

  const currentHintTier = activeMilestone ? (hintTierByMilestone[activeMilestone.id] || 0) : 0;

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#6D28D9] bg-[#F5F3FF] px-2.5 py-0.5 rounded">
            3 Progressive Project Levels
          </span>
          <h1 className="text-xl font-bold text-[#162A43] mt-1">
            Curriculum-Integrated Projects &amp; GitHub Verification
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Level 1 Concept Builds → Level 2 Multi-Module Integration → Level 3 Career Capstone.
          </p>
        </div>
        {onBackToOverview && (
          <button onClick={onBackToOverview} className="px-4 py-2 rounded-xl border border-[#E4E1DA] text-xs font-bold text-[#162A43]">
            ← Overview
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Project List */}
        <div className="lg:col-span-4 space-y-3">
          {projects.map((p) => {
            const active = p.id === activeProject.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedId(p.id);
                  setActiveMilestoneIdx(0);
                  setMilestoneResult(null);
                  setRepoResult(null);
                }}
                className={`w-full text-left p-4 rounded-2xl border transition space-y-1.5 ${
                  active ? "bg-[#F5F3FF] border-[#6D28D9]" : "bg-white border-[#E4E1DA] hover:border-stone-400"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-[#6D28D9] uppercase">{p.levelLabel}</span>
                  <span>{p.isUnlocked ? "✓ Unlocked" : "🔒 Gated"}</span>
                </div>
                <div className="text-sm font-bold text-[#162A43]">{p.title}</div>
                <div className="text-[11px] text-stone-500">{p.domain} • ~{p.estimatedHours} hrs</div>
              </button>
            );
          })}
        </div>

        {/* Active Project Workspace */}
        <div className="lg:col-span-8 bg-white border border-[#E4E1DA] rounded-2xl p-6 shadow-sm space-y-5">
          {!activeProject.isUnlocked && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <strong>🔒 Prerequisite Topics Pending:</strong> Complete{" "}
              {activeProject.missingPrerequisites.join(", ")} before submitting this level.
            </div>
          )}

          <div>
            <div className="text-[10.5px] font-bold uppercase text-[#6D28D9]">{activeProject.levelLabel}</div>
            <h2 className="text-lg font-bold text-[#162A43]">{activeProject.title}</h2>
            <p className="text-xs text-stone-700 mt-1">{activeProject.problemStatement}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E4E1DA]">
              <div className="font-bold text-[#162A43] mb-1">Technical Requirements &amp; Architecture</div>
              <ul className="list-disc pl-4 text-stone-600 space-y-1">
                {activeProject.architectureSummary.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E4E1DA]">
              <div className="font-bold text-[#162A43] mb-1">Evaluation Rubric</div>
              <ul className="space-y-1 text-stone-600">
                {activeProject.evaluationRubric.map((r, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{r.criterion}</span>
                    <strong>{r.weightPercent}%</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Interactive Implementation Milestone */}
          {activeMilestone && (
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E4E1DA] space-y-3">
              <div className="font-bold text-sm text-[#162A43]">{activeMilestone.title}</div>
              <p className="text-xs text-stone-700">{activeMilestone.description}</p>
              <textarea
                rows={8}
                value={codeByMilestone[activeMilestone.id] ?? activeMilestone.starterCode}
                onChange={(e) =>
                  setCodeByMilestone((prev) => ({ ...prev, [activeMilestone.id]: e.target.value }))
                }
                className="w-full p-3 rounded-xl border border-[#CBD5E1] bg-white font-mono text-xs text-[#162A43]"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() =>
                    setHintTierByMilestone((prev) => ({
                      ...prev,
                      [activeMilestone.id]: Math.min(3, (prev[activeMilestone.id] || 0) + 1),
                    }))
                  }
                  className="px-3 py-1.5 rounded-lg border border-[#DDD6FE] bg-[#F5F3FF] text-[#5B21B6] text-xs font-bold"
                >
                  {currentHintTier < 3 ? `Reveal Progressive Hint (${currentHintTier}/3)` : "All 3 Hints Shown"}
                </button>
                <button
                  onClick={handleVerifyMilestone}
                  disabled={verifying}
                  className="px-5 py-2 bg-[#6D28D9] text-white text-xs font-bold rounded-xl"
                >
                  {verifying ? "Verifying Implementation..." : "Verify Milestone Code ▶"}
                </button>
              </div>

              {currentHintTier > 0 && (
                <div className="space-y-1.5">
                  {activeMilestone.hints.slice(0, currentHintTier).map((h, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white border border-[#DDD6FE] text-xs text-[#162A43]">
                      <strong>Hint {i + 1}:</strong> {h}
                    </div>
                  ))}
                </div>
              )}

              {milestoneResult && (
                <div className={`p-3 rounded-xl border text-xs ${milestoneResult.passed ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-amber-50 border-amber-200 text-amber-900"}`}>
                  <div className="font-bold">{milestoneResult.passed ? "✓ PASSED" : "Needs Fixes"} ({milestoneResult.score}%)</div>
                  <div>{milestoneResult.feedback}</div>
                  {milestoneResult.stderr && <pre className="font-mono text-[11px] text-rose-700 mt-1">{milestoneResult.stderr}</pre>}
                </div>
              )}
            </div>
          )}

          {/* GitHub Repository Verification */}
          <div className="p-4 rounded-xl bg-white border border-[#E4E1DA] space-y-2.5">
            <div className="text-xs font-bold text-[#162A43]">GitHub Repository Proof &amp; Student DNA Verification</div>
            <div className="flex gap-2 flex-wrap">
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/your-handle/project-repo"
                className="flex-1 min-w-[240px] px-3 py-2 rounded-xl border border-[#E4E1DA] bg-[#FAF9F6] text-xs"
              />
              <button
                onClick={handleVerifyGithub}
                className="px-4 py-2 bg-[#162A43] text-white text-xs font-bold rounded-xl"
              >
                Verify GitHub Repo
              </button>
            </div>
            {repoResult && (
              <div className={`p-2.5 rounded-lg text-xs border ${repoResult.verified ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-900"}`}>
                {repoResult.reason}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
