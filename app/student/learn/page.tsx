"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import UnifiedLearningWorkspace from "@/components/skills/learn/UnifiedLearningWorkspace";
import { CanonicalSubjectSlug } from "@/lib/skills/curriculum/types";
import AppNav from "@/components/AppNav";

function LearnPageContent() {
  const searchParams = useSearchParams();
  const subject = (searchParams.get("subject") as CanonicalSubjectSlug) || "python";
  const subtopic = searchParams.get("subtopic") || undefined;
  const candidateId = typeof window !== "undefined" ? localStorage.getItem("cognalyze_student_id") || "guest" : "guest";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-canvas)", color: "var(--text-primary)" }}>
      <AppNav role="student" />
      <UnifiedLearningWorkspace
        initialSubjectSlug={subject}
        initialSubtopicSlug={subtopic}
        candidateId={candidateId}
      />
    </div>
  );
}

export default function StudentLearnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F5F1] flex items-center justify-center p-8 text-[#667085]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#356AE6] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Launching Unified Learning Platform...</p>
          </div>
        </div>
      }
    >
      <LearnPageContent />
    </Suspense>
  );
}

