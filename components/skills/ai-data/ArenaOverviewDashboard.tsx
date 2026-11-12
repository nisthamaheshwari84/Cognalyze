"use client";

import React from "react";
import Link from "next/link";
import {
  TAXONOMY_SUBJECTS,
  TaxonomySubject,
  TaxonomyModule,
  TaxonomyTopic,
  getAllCurriculumTopicsFlat,
} from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import { TargetRoleSlug } from "@/lib/skills/ai-data/types";
import { TARGET_ROLE_PROFILES } from "@/lib/skills/ai-data/roles";

interface ArenaOverviewDashboardProps {
  candidateId: string;
  activeRole: TargetRoleSlug;
  completedTopicIds: string[];
  onSelectSubject: (subjectId: string) => void;
  onOpenRoadmap: () => void;
  onOpenCodingArena: (topicId?: string) => void;
  onOpenNotes: (topicId?: string) => void;
  onSelectRole: (role: TargetRoleSlug) => void;
}

export default function ArenaOverviewDashboard({
  candidateId,
  activeRole,
  completedTopicIds,
  onSelectSubject,
  onOpenRoadmap,
  onOpenCodingArena,
  onOpenNotes,
  onSelectRole,
}: ArenaOverviewDashboardProps) {
  const roleProfile = TARGET_ROLE_PROFILES[activeRole] || TARGET_ROLE_PROFILES.ai_engineer;
  const allFlatTopics = getAllCurriculumTopicsFlat();
  const masteryPercentage = Math.round((completedTopicIds.length / (allFlatTopics.length || 1)) * 100);

  // Compute next recommended topic
  const nextRecommendedTopic =
    allFlatTopics.find((t) => !completedTopicIds.includes(t.topic.id))?.topic ||
    allFlatTopics[0]?.topic;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* ── HERO BANNER & CAREER GOAL ── */}
      <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#356AE6] bg-[#356AE6]/10 px-2.5 py-0.5 rounded-md">
              Career-Driven Learning
            </span>
            <span className="text-[11px] font-semibold text-stone-500">
              Target: {roleProfile.title}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#162A43] tracking-tight">
            AI &amp; Data Engineering Arena
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-2xl leading-relaxed">
            Curriculum-driven, personalized mastery engine. Connecting foundational CPython mechanics,
            vectorized computation, relational SQL, deep neural architectures, and enterprise AI agent systems.
          </p>
        </div>

        {/* Career Target & Progress Pill */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-left lg:text-right w-full sm:w-auto">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Demonstrated Mastery
            </div>
            <div className="text-2xl font-black text-[#162A43] mt-0.5">
              {completedTopicIds.length} / {allFlatTopics.length} Topics
              <span className="text-emerald-700 text-sm font-bold ml-2">({masteryPercentage}%)</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-[#356AE6] h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, masteryPercentage)}%` }}
              />
            </div>
          </div>

          <button
            onClick={onOpenRoadmap}
            className="px-5 py-2.5 bg-[#162A43] hover:bg-[#1f3a5c] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <span>View Customized Roadmap</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* ── NEXT RECOMMENDED ACTION CARD ── */}
      {nextRecommendedTopic && (
        <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#356AE6] animate-pulse" />
              <span className="text-xs font-bold text-[#356AE6] uppercase tracking-wider">
                Next Recommended Step
              </span>
            </div>
            <h3 className="text-base font-bold text-[#162A43]">
              {nextRecommendedTopic.title}
            </h3>
            <p className="text-xs text-stone-600 line-clamp-1">
              {nextRecommendedTopic.contextAndIntuition?.english || nextRecommendedTopic.practicalOutcome}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenCodingArena(nextRecommendedTopic.id)}
              className="px-4 py-2 bg-white border border-[#E4E1DA] hover:border-stone-400 text-stone-700 text-xs font-semibold rounded-xl transition shadow-sm"
            >
              Practise Coding ⚡
            </button>
            <button
              onClick={() => onSelectSubject(nextRecommendedTopic.trackId.replace("track_", "subj_"))}
              className="px-5 py-2 bg-[#356AE6] hover:bg-[#2855C7] text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              Continue Learning →
            </button>
          </div>
        </div>
      )}

      {/* ── 8 CORE SUBJECTS GRID ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#162A43]">
              Canonical Curriculum Disciplines
            </h2>
            <p className="text-xs text-stone-500">
              14 Connected Subjects • Subject → Module → Topic → Subtopic Hierarchy
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TAXONOMY_SUBJECTS.map((subj: TaxonomySubject) => {
            const subjectTopics = subj.modules.flatMap((m: TaxonomyModule) => m.topics);
            const completedCount = subjectTopics.filter((t: TaxonomyTopic) => completedTopicIds.includes(t.id)).length;
            const pct = Math.round((completedCount / (subjectTopics.length || 1)) * 100);

            return (
              <div
                key={subj.id}
                className="bg-white border border-[#E4E1DA] rounded-2xl p-5 shadow-sm hover:border-stone-400 transition flex flex-col justify-between gap-4 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{subj.icon}</span>
                    <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded uppercase">
                      {subj.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#162A43] group-hover:text-[#356AE6] transition">
                    {subj.title}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                    {subj.description}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-stone-100">
                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <span>{subj.modules.length} Modules • {subjectTopics.length} Topics</span>
                    <span className="font-bold text-[#162A43]">{pct}% Done</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#356AE6] h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onSelectSubject(subj.id)}
                      className="flex-1 py-1.5 bg-stone-50 hover:bg-[#356AE6] hover:text-white border border-[#E4E1DA] hover:border-[#356AE6] text-stone-700 text-xs font-semibold rounded-lg transition text-center"
                    >
                      Study Subject
                    </button>
                    <button
                      onClick={() => onOpenCodingArena(subjectTopics[0]?.id)}
                      className="px-3 py-1.5 border border-[#E4E1DA] hover:border-stone-400 bg-white text-stone-600 text-xs font-semibold rounded-lg transition"
                      title="Practice Coding"
                    >
                      ⚡
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
