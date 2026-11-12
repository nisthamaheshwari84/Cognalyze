"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { TargetRoleSlug } from "@/lib/skills/ai-data/types";
import { TARGET_ROLE_PROFILES } from "@/lib/skills/ai-data/roles";
import {
  TAXONOMY_SUBJECTS,
  TaxonomySubject,
  TaxonomyModule,
  TaxonomyTopic,
  getAllCurriculumTopicsFlat,
} from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import { CandidatePracticeAnalytics } from "@/lib/skills/ai-data/company-question-bank-types";

interface ArenaDnaProgressViewProps {
  candidateId: string;
  activeRole: TargetRoleSlug;
  completedTopicIds: string[];
  onOpenTopic: (topicId: string) => void;
  onOpenCodingArena: (topicId?: string) => void;
}

export default function ArenaDnaProgressView({
  candidateId,
  activeRole,
  completedTopicIds,
  onOpenTopic,
  onOpenCodingArena,
}: ArenaDnaProgressViewProps) {
  const [analytics, setAnalytics] = useState<CandidatePracticeAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const roleProfile = TARGET_ROLE_PROFILES[activeRole] || TARGET_ROLE_PROFILES.ai_engineer;
  const allTopics = useMemo(() => getAllCurriculumTopicsFlat(), []);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/skills/ai-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "get_practice_analytics",
            candidateId,
          }),
        });
        const data = await res.json();
        if (data.success && data.analytics) {
          setAnalytics(data.analytics);
        }
      } catch (e) {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [candidateId]);

  const learningPercentage = Math.round((completedTopicIds.length / (allTopics.length || 1)) * 100);
  const questionsSolved = analytics?.totalAttempted || 0;
  const questionsCorrect = analytics?.totalSolved || 0;
  const accuracy = analytics?.overallAccuracyPercent || (questionsSolved > 0 ? Math.round((questionsCorrect / questionsSolved) * 100) : 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {/* Header */}
      <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">🧬</span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#356AE6] bg-[#356AE6]/10 px-2.5 py-0.5 rounded-md">
              Student DNA Dossier
            </span>
            <span className="text-xs font-semibold text-stone-500">
              Anti-Simulation Invariant Verified
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#162A43]">
            Demonstrated Evidence &amp; Proficiency Intelligence
          </h1>
          <p className="text-xs text-stone-600 mt-1 max-w-xl">
            Cognalyze strictly separates passive learning progress (reading lessons) from verified demonstrated competence (passing hidden test suites).
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-center">
            <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Candidate Role</div>
            <div className="text-sm font-bold text-[#162A43] mt-0.5">{roleProfile.title}</div>
          </div>
        </div>
      </div>

      {/* 2 Big Pillars: Learning Progress vs Demonstrated Proficiency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pillar 1: Learning Progress */}
        <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Metric 1</span>
              <h3 className="text-base font-bold text-[#162A43]">Learning &amp; Curriculum Coverage</h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {learningPercentage}%
            </span>
          </div>
          <p className="text-xs text-stone-600">
            Measures topics opened, conceptual explanations reviewed, mental models explored, and subtopics completed.
          </p>
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-600">Topics Completed</span>
              <span className="font-bold text-[#162A43]">{completedTopicIds.length} / {allTopics.length}</span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#356AE6] h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, learningPercentage)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pillar 2: Demonstrated Proficiency */}
        <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Metric 2</span>
              <h3 className="text-base font-bold text-[#162A43]">Demonstrated Proficiency</h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {accuracy}% Accuracy
            </span>
          </div>
          <p className="text-xs text-stone-600">
            Measures independent code execution, sandboxed unit tests passed, and verified assessment scores.
          </p>
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-600">Practice Challenges Solved</span>
              <span className="font-bold text-emerald-700">{questionsCorrect} passed</span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, accuracy)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Subject-Wise Competency Mastery Breakdown */}
      <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#162A43] uppercase tracking-wider">
          Subject-Wise Evidence &amp; Mastery Matrix
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TAXONOMY_SUBJECTS.map((s: TaxonomySubject) => {
            const subjTopics = s.modules.flatMap((m: TaxonomyModule) => m.topics);
            const count = subjTopics.filter((t: TaxonomyTopic) => completedTopicIds.includes(t.id)).length;
            const pct = Math.round((count / (subjTopics.length || 1)) * 100);

            return (
              <div key={s.id} className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#162A43] flex items-center gap-1.5 truncate">
                    <span>{s.icon}</span>
                    <span className="truncate">{s.title}</span>
                  </span>
                  <span className="font-bold text-stone-600 shrink-0">{pct}%</span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#356AE6] h-full rounded-full"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4">
        <Link href="/student/skills" className="text-xs font-semibold text-stone-600 hover:text-stone-900">
          ← Return to Skill Practice Hub
        </Link>
        <button
          onClick={() => onOpenCodingArena()}
          className="px-6 py-2.5 bg-[#356AE6] hover:bg-[#2855C7] text-white text-xs font-bold rounded-xl shadow-sm transition"
        >
          Open Coding Arena to Build More Evidence →
        </button>
      </div>
    </div>
  );
}
