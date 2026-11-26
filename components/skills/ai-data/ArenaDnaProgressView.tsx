"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TargetRoleSlug, TopicMasteryRecord } from "@/lib/skills/ai-data/types";
import { TARGET_ROLE_PROFILES } from "@/lib/skills/ai-data/roles";
import { TAXONOMY_SUBJECTS, TaxonomySubject } from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import { CandidatePracticeAnalytics } from "@/lib/skills/ai-data/company-question-bank-types";

interface ArenaDnaProgressViewProps {
  candidateId: string;
  activeRole: TargetRoleSlug;
  completedTopicIds: string[];
  topicMasteryMap?: Record<string, TopicMasteryRecord>;
  onOpenTopic: (topicId: string) => void;
  onOpenCodingArena: (topicId?: string) => void;
}

export default function ArenaDnaProgressView({
  candidateId,
  activeRole,
  completedTopicIds,
  topicMasteryMap = {},
  onOpenCodingArena,
}: ArenaDnaProgressViewProps) {
  const [analytics, setAnalytics] = useState<CandidatePracticeAnalytics | null>(null);
  const roleProfile = TARGET_ROLE_PROFILES[activeRole] || TARGET_ROLE_PROFILES.ai_engineer;

  useEffect(() => {
    fetch("/api/skills/ai-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_practice_analytics", candidateId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.analytics) setAnalytics(data.analytics);
      })
      .catch(() => {});
  }, [candidateId]);

  const records = Object.values(topicMasteryMap);
  const countByStatus = {
    learning: records.filter((r) => r.status === "learning").length,
    practiced: records.filter((r) => r.status === "practiced").length,
    assessment_passed: records.filter((r) => r.status === "assessment_passed").length,
    demonstrated: records.filter((r) => r.status === "demonstrated").length,
    mastered_verified: records.filter((r) => r.status === "mastered_verified").length,
  };
  const totalTrackedTopics = 154;
  const notStartedCount = Math.max(
    0,
    totalTrackedTopics -
      (countByStatus.learning +
        countByStatus.practiced +
        countByStatus.assessment_passed +
        countByStatus.demonstrated +
        countByStatus.mastered_verified)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-7 font-sans">
      <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#6D28D9] bg-[#F5F3FF] border border-[#DDD6FE] px-2.5 py-0.5 rounded-md">
            Verified Student DNA Ledger
          </span>
          <h1 className="text-2xl font-bold text-[#162A43] mt-2">
            Evidence-Driven Mastery &amp; Skill Integrity
          </h1>
          <p className="text-xs text-stone-600 mt-1 max-w-xl">
            Opening a lesson only marks Learning. Verified competencies require passing code assertions, practical labs, assessments, and own-words defense.
          </p>
        </div>

        <div className="p-4 bg-[#FAF9F6] border border-[#E4E1DA] rounded-xl text-center shrink-0">
          <div className="text-[10px] font-bold text-stone-500 uppercase">Target Role</div>
          <div className="text-sm font-bold text-[#162A43] mt-0.5">{roleProfile.title}</div>
        </div>
      </div>

      {/* 6-Stage Proficiency Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Not Started", val: notStartedCount, cls: "bg-white border-[#E4E1DA] text-stone-700" },
          { label: "Learning", val: countByStatus.learning, cls: "bg-blue-50 border-blue-200 text-blue-900" },
          { label: "Practiced", val: countByStatus.practiced, cls: "bg-[#F5F3FF] border-[#DDD6FE] text-[#5B21B6]" },
          { label: "Assessment Passed", val: countByStatus.assessment_passed, cls: "bg-amber-50 border-amber-200 text-amber-900" },
          { label: "Demonstrated", val: countByStatus.demonstrated, cls: "bg-teal-50 border-teal-200 text-teal-900" },
          { label: "Mastered & Verified", val: countByStatus.mastered_verified, cls: "bg-emerald-50 border-emerald-200 text-emerald-900" },
        ].map((card) => (
          <div key={card.label} className={`p-4 rounded-xl border text-center ${card.cls}`}>
            <div className="text-2xl font-black">{card.val}</div>
            <div className="text-[11px] font-bold mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Practice Accuracy Metrics */}
      {analytics && (
        <div className="bg-white border border-[#E4E1DA] rounded-2xl p-5 shadow-sm flex flex-wrap gap-6 text-xs">
          <div>
            <span className="text-stone-500">Questions Attempted:</span>{" "}
            <strong className="text-[#162A43]">{analytics.totalAttempted}</strong>
          </div>
          <div>
            <span className="text-stone-500">Verified Correct:</span>{" "}
            <strong className="text-emerald-700">{analytics.totalSolved}</strong>
          </div>
          <div>
            <span className="text-stone-500">Verified Accuracy:</span>{" "}
            <strong className="text-[#6D28D9]">{analytics.overallAccuracyPercent}%</strong>
          </div>
        </div>
      )}

      {/* Subject Mastery Grid */}
      <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#162A43] uppercase tracking-wider">Subject-Wise Verified Mastery</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TAXONOMY_SUBJECTS.map((s: TaxonomySubject) => {
            const subjTopics = s.modules.flatMap((m) => m.topics);
            const verifiedCount = subjTopics.filter((t) => {
              const rec = topicMasteryMap[t.id];
              return (
                completedTopicIds.includes(t.id) ||
                rec?.status === "assessment_passed" ||
                rec?.status === "demonstrated" ||
                rec?.status === "mastered_verified"
              );
            }).length;
            const pct = Math.round((verifiedCount / (subjTopics.length || 1)) * 100);
            return (
              <div key={s.id} className="p-3.5 bg-[#FAF9F6] border border-[#E4E1DA] rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#162A43] truncate">{s.icon} {s.title}</span>
                  <span className="font-bold text-[#6D28D9]">{pct}%</span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#6D28D9] h-full rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link href="/student/skills" className="text-xs font-semibold text-stone-600 hover:text-stone-900">
          ← Return to Skill Practice Hub
        </Link>
        <button
          onClick={() => onOpenCodingArena()}
          className="px-5 py-2.5 bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold rounded-xl shadow-sm"
        >
          Open Coding Studio →
        </button>
      </div>
    </div>
  );
}
