"use client";

import React from "react";
import { TAXONOMY_SUBJECTS, TaxonomySubject } from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import { TargetRoleSlug, LearningPosition, TopicMasteryRecord } from "@/lib/skills/ai-data/types";
import { TARGET_ROLE_PROFILES, getAllTargetRoles } from "@/lib/skills/ai-data/roles";
import type { CanonicalArenaRoadmap } from "@/lib/skills/ai-data/sequencing-engine";

interface ArenaOverviewDashboardProps {
  candidateId: string;
  activeRole: TargetRoleSlug;
  completedTopicIds: string[];
  canonicalRoadmap?: CanonicalArenaRoadmap | null;
  topicMasteryMap?: Record<string, TopicMasteryRecord>;
  learningPosition?: LearningPosition | null;
  onSelectTopic: (topicId: string, phase?: string) => void;
  onSelectSubject: (subjectId: string) => void;
  onOpenRoadmap: () => void;
  onOpenCodingArena: (topicId?: string) => void;
  onOpenPracticalLabs: (topicId?: string) => void;
  onOpenAssessments: (topicId?: string) => void;
  onOpenProjects: () => void;
  onOpenNotes: (topicId?: string) => void;
  onSelectRole: (role: TargetRoleSlug) => void;
}

export default function ArenaOverviewDashboard({
  activeRole,
  completedTopicIds,
  canonicalRoadmap,
  topicMasteryMap = {},
  learningPosition,
  onSelectTopic,
  onSelectSubject,
  onOpenRoadmap,
  onOpenCodingArena,
  onOpenPracticalLabs,
  onOpenAssessments,
  onOpenProjects,
  onSelectRole,
}: ArenaOverviewDashboardProps) {
  const allRoles = getAllTargetRoles();
  const roleProfile = TARGET_ROLE_PROFILES[activeRole] || TARGET_ROLE_PROFILES.ai_engineer;
  const totalTopics = canonicalRoadmap?.totalTopics || 154;
  const masteredCount = canonicalRoadmap?.masteredCount ?? Object.values(topicMasteryMap).filter((r) => r.status === "mastered_verified").length;
  const completedCount = canonicalRoadmap?.completedCount ?? completedTopicIds.length;
  const masteryPct = canonicalRoadmap?.overallProgressPercent ?? Math.round((completedCount / Math.max(1, totalTopics)) * 100);

  const nextTopic = canonicalRoadmap?.recommendedNextTopic;
  const continueTopicId = learningPosition?.topicId || nextTopic?.topicId || "py-01-intro-interpreter";
  const continueTopicTitle = nextTopic?.title || "Introduction to Programming & The Python Interpreter";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7 font-sans">
      {/* ── HERO BANNER WITH CAREER TARGET & PRIMARY CONTINUE ACTION ── */}
      <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6D28D9] bg-[#F5F3FF] border border-[#DDD6FE] px-2.5 py-0.5 rounded-md">
              Sequential Mastery Engine
            </span>
            <select
              value={activeRole}
              onChange={(e) => onSelectRole(e.target.value as TargetRoleSlug)}
              className="text-xs font-bold text-[#162A43] bg-[#FAF9F6] border border-[#E4E1DA] rounded-lg px-2.5 py-1 outline-none cursor-pointer"
            >
              {allRoles.map((r) => (
                <option key={r.slug} value={r.slug}>
                  Target: {r.icon} {r.title}
                </option>
              ))}
            </select>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#162A43] tracking-tight">
            {roleProfile.title} Mastery Path
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Learn one prerequisite-verified concept at a time: Understand the intuition, execute real code, debug comprehension traps, pass practical labs &amp; assessments, and ship portfolio projects.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => onSelectTopic(continueTopicId, learningPosition?.phase || "understand")}
              className="px-5 py-2.5 bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <span>Continue Learning</span>
              <span>→</span>
            </button>
            <button
              onClick={onOpenRoadmap}
              className="px-4 py-2.5 bg-white hover:bg-[#FAF9F6] text-[#162A43] border border-[#E4E1DA] text-xs font-bold rounded-xl transition"
            >
              My Learning Path &amp; Diagnostic
            </button>
          </div>
        </div>

        {/* Verified Mastery Summary Box */}
        <div className="p-5 bg-[#FAF9F6] border border-[#E4E1DA] rounded-xl w-full lg:w-80 space-y-3 shrink-0">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-500">
            <span>Verified Progress</span>
            <span className="text-[#6D28D9]">{masteryPct}%</span>
          </div>
          <div className="text-xl font-extrabold text-[#162A43]">
            {completedCount} / {totalTopics} Topics
          </div>
          <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#6D28D9] h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, masteryPct)}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
            <div className="bg-white border border-[#E4E1DA] rounded-lg px-2.5 py-1.5">
              <div className="text-stone-500">Fully Mastered</div>
              <div className="font-bold text-emerald-700">{masteredCount} topics</div>
            </div>
            <div className="bg-white border border-[#E4E1DA] rounded-lg px-2.5 py-1.5">
              <div className="text-stone-500">Verified Skills</div>
              <div className="font-bold text-[#162A43]">{canonicalRoadmap?.verifiedCompetencies?.length || 0} skills</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CURRENT POSITION + PREREQUISITE + UPCOMING WORKFLOW CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E4E1DA] rounded-xl p-4 space-y-2 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#6D28D9]">Current Next Topic</div>
          <div className="text-sm font-bold text-[#162A43] line-clamp-2">{continueTopicTitle}</div>
          <div className="text-[11px] text-stone-500">
            {nextTopic?.unlockedReason || "Prerequisites satisfied — ready to learn."}
          </div>
          <button
            onClick={() => onSelectTopic(continueTopicId)}
            className="text-xs font-bold text-[#6D28D9] hover:underline pt-1"
          >
            Open Lesson →
          </button>
        </div>

        <div className="bg-white border border-[#E4E1DA] rounded-xl p-4 space-y-2 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Prerequisite Readiness</div>
          <div className="text-sm font-bold text-[#162A43]">
            {(canonicalRoadmap?.missingPrerequisites?.length || 0) === 0
              ? "All Initial Gates Open"
              : `${canonicalRoadmap?.missingPrerequisites.length} Module Gate(s) Remaining`}
          </div>
          <div className="text-[11px] text-stone-500 line-clamp-2">
            {(canonicalRoadmap?.missingPrerequisites || []).slice(0, 2).join(", ") || "Complete each topic's lab + assessment to unlock next."}
          </div>
          <button onClick={onOpenRoadmap} className="text-xs font-bold text-[#162A43] hover:underline pt-1">
            Inspect Dependency Graph →
          </button>
        </div>

        <div className="bg-white border border-[#E4E1DA] rounded-xl p-4 space-y-2 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Upcoming Coding &amp; Lab</div>
          <div className="text-sm font-bold text-[#162A43] line-clamp-2">
            {canonicalRoadmap?.upcomingPracticals?.[0]?.title || continueTopicTitle}
          </div>
          <div className="text-[11px] text-stone-500">Hands-on sandbox evaluation required for topic progression.</div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => onOpenPracticalLabs(continueTopicId)} className="text-xs font-bold text-[#6D28D9] hover:underline">
              Open Lab →
            </button>
            <button onClick={() => onOpenCodingArena(continueTopicId)} className="text-xs font-bold text-stone-600 hover:underline">
              Coding Studio
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#E4E1DA] rounded-xl p-4 space-y-2 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Assessment &amp; Projects</div>
          <div className="text-sm font-bold text-[#162A43] line-clamp-2">
            {canonicalRoadmap?.upcomingAssessments?.[0]?.title || "Topic Mastery Check"}
          </div>
          <div className="text-[11px] text-stone-500">3 progressive project levels unlock as you verify topics.</div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => onOpenAssessments(continueTopicId)} className="text-xs font-bold text-[#6D28D9] hover:underline">
              Take Assessment →
            </button>
            <button onClick={onOpenProjects} className="text-xs font-bold text-stone-600 hover:underline">
              Projects
            </button>
          </div>
        </div>
      </div>

      {/* ── PREREQUISITE-ORDERED CURRICULUM DISCIPLINES ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#162A43]">Curriculum Sequence ({roleProfile.title})</h2>
            <p className="text-xs text-stone-500">
              14 Subjects • Sequential Subject → Module → Topic → Subtopic → Practice → Mastery
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(canonicalRoadmap?.subjects || []).map((subjGrp) => (
            <div
              key={subjGrp.subjectId}
              className={`bg-white border rounded-2xl p-5 shadow-sm transition flex flex-col justify-between gap-4 ${
                subjGrp.isUnlocked ? "border-[#E4E1DA] hover:border-[#6D28D9]/50" : "border-[#E4E1DA] opacity-85 bg-[#FAF9F6]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{subjGrp.icon}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      subjGrp.isUnlocked
                        ? "text-[#6D28D9] bg-[#F5F3FF] border border-[#DDD6FE]"
                        : "text-stone-500 bg-stone-200"
                    }`}
                  >
                    {subjGrp.isUnlocked ? subjGrp.roleImportance : "🔒 Locked"}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#162A43]">{subjGrp.title}</h3>
                <p className="text-xs text-stone-500 mt-1 line-clamp-2">{subjGrp.roleWhy}</p>
                {!subjGrp.isUnlocked && subjGrp.missingPrerequisiteSubjects.length > 0 && (
                  <p className="text-[11px] text-amber-700 font-medium mt-2">
                    Requires: {subjGrp.missingPrerequisiteSubjects.join(", ")}
                  </p>
                )}
              </div>

              <div className="space-y-3 pt-3 border-t border-stone-100">
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span>{subjGrp.completedTopics}/{subjGrp.totalTopics} Topics Verified</span>
                  <span className="font-bold text-[#162A43]">{subjGrp.percentMastered}%</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#6D28D9] h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, subjGrp.percentMastered)}%` }}
                  />
                </div>
                <button
                  onClick={() => {
                    const nextInSubj = subjGrp.topics.find((t) => t.lockState !== "COMPLETED" && t.lockState !== "MASTERED") || subjGrp.topics[0];
                    if (nextInSubj) onSelectTopic(nextInSubj.topicId);
                    else onSelectSubject(subjGrp.subjectId);
                  }}
                  className="w-full py-2 bg-[#FAF9F6] hover:bg-[#6D28D9] hover:text-white border border-[#E4E1DA] text-[#162A43] text-xs font-bold rounded-xl transition"
                >
                  {subjGrp.isUnlocked ? "Study Next Topic →" : "Inspect Prerequisites →"}
                </button>
              </div>
            </div>
          ))}
          {(!canonicalRoadmap || canonicalRoadmap.subjects.length === 0) &&
            TAXONOMY_SUBJECTS.map((subj: TaxonomySubject) => (
              <div key={subj.id} className="bg-white border border-[#E4E1DA] rounded-2xl p-5 shadow-sm">
                <div className="text-sm font-bold text-[#162A43]">{subj.icon} {subj.title}</div>
                <button
                  onClick={() => onSelectSubject(subj.id)}
                  className="mt-3 w-full py-2 bg-[#6D28D9] text-white text-xs font-bold rounded-xl"
                >
                  Open Subject →
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
