"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import MasterCurriculumSidebar from "@/components/skills/ai-data/MasterCurriculumSidebar";
import SequentialMicroLearningWorkspace from "@/components/skills/ai-data/SequentialMicroLearningWorkspace";
import ContextualAiMentorDrawer from "@/components/skills/ai-data/ContextualAiMentorDrawer";
import CanonicalLearningPathView from "@/components/skills/ai-data/CanonicalLearningPathView";
import GlobalCodingArena from "@/components/skills/ai-data/GlobalCodingArena";
import PracticalLabsHub from "@/components/skills/ai-data/PracticalLabsHub";
import IntegratedAssessmentsHub from "@/components/skills/ai-data/IntegratedAssessmentsHub";
import GlobalNotesLibrary from "@/components/skills/ai-data/GlobalNotesLibrary";
import ArenaOverviewDashboard from "@/components/skills/ai-data/ArenaOverviewDashboard";
import AppliedProjectsHub from "@/components/skills/ai-data/AppliedProjectsHub";
import ArenaDnaProgressView from "@/components/skills/ai-data/ArenaDnaProgressView";
import {
  getTaxonomyTopicById,
  getTopicLocation,
  getAllCurriculumTopicsFlat,
  TAXONOMY_SUBJECTS,
} from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import {
  TargetRoleSlug,
  TopicMasteryRecord,
  LearningPosition,
  LearningPhaseId,
} from "@/lib/skills/ai-data/types";
import type { CanonicalArenaRoadmap } from "@/lib/skills/ai-data/sequencing-engine";

export type PrimaryArenaTab =
  | "overview"
  | "roadmap"
  | "learn"
  | "coding-arena"
  | "practical-labs"
  | "assessments"
  | "projects"
  | "notes"
  | "dna";

const VALID_TABS: PrimaryArenaTab[] = [
  "overview",
  "roadmap",
  "learn",
  "coding-arena",
  "practical-labs",
  "assessments",
  "projects",
  "notes",
  "dna",
];

function AiDataArenaMain() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTab = (() => {
    const t = searchParams.get("tab") as PrimaryArenaTab | null;
    return t && VALID_TABS.includes(t) ? t : "overview";
  })();

  const [candidateId, setCandidateId] = useState<string>("student-demo");
  const [activeRole, setActiveRole] = useState<TargetRoleSlug>(
    (searchParams.get("role") as TargetRoleSlug) || "ai_engineer"
  );
  const [primaryTab, setPrimaryTab] = useState<PrimaryArenaTab>(initialTab);
  const [activeTopicId, setActiveTopicId] = useState<string>(
    searchParams.get("topic") || "py-01-intro-interpreter"
  );
  const [language, setLanguage] = useState<"english" | "hinglish">("english");

  // Authoritative canonical mastery state from backend store + Supabase
  const [completedTopicIds, setCompletedTopicIds] = useState<string[]>([]);
  const [canonicalRoadmap, setCanonicalRoadmap] = useState<CanonicalArenaRoadmap | null>(null);
  const [topicMasteryMap, setTopicMasteryMap] = useState<Record<string, TopicMasteryRecord>>({});
  const [learningPosition, setLearningPosition] = useState<LearningPosition | null>(null);

  // Live telemetry for AI Mentor Drawer
  const [mentorTelemetry, setMentorTelemetry] = useState<{
    subtopicTitle?: string;
    learningPhase?: LearningPhaseId;
    userCode?: string;
    executionStdout?: string;
    executionStderr?: string;
    weakConcepts?: string[];
    assessmentScore?: number | null;
  }>({});

  // UI states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAiMentorOpen, setIsAiMentorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const candidateIdRef = useRef(candidateId);
  const initialRoleParamRef = useRef(searchParams.get("role"));

  useEffect(() => {
    candidateIdRef.current = candidateId;
  }, [candidateId]);

  const refreshCanonicalContext = useCallback(async (explicitCid?: string) => {
    const cid = explicitCid || candidateIdRef.current;
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_canonical_context", candidateId: cid }),
      });
      const data = await res.json();
      if (data?.success && data.summary) {
        if (Array.isArray(data.summary.completedLessons)) {
          setCompletedTopicIds(data.summary.completedLessons);
        }
        if (data.summary.selectedRole && !initialRoleParamRef.current) {
          setActiveRole(data.summary.selectedRole);
        }
        if (data.summary.canonicalRoadmap) {
          setCanonicalRoadmap(data.summary.canonicalRoadmap);
        }
        if (data.summary.topicMasteryMap) {
          setTopicMasteryMap(data.summary.topicMasteryMap);
        }
        if (data.summary.learningPosition) {
          setLearningPosition(data.summary.learningPosition);
        }
      }
      if (data?.languagePreference === "english" || data?.languagePreference === "hinglish") {
        setLanguage(data.languagePreference);
      }
    } catch {
      // Resilient fallback handled by state defaults
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initSession() {
      try {
        const sessRes = await fetch("/api/auth/session");
        const sess = await sessRes.json();
        const cid =
          sess?.user?.id ||
          (typeof window !== "undefined" ? localStorage.getItem("cognalyze_student_id") : null) ||
          "student-demo";
        if (cancelled) return;
        candidateIdRef.current = cid;
        setCandidateId(cid);
        await refreshCanonicalContext(cid);
      } catch {
        if (!cancelled) {
          await refreshCanonicalContext("student-demo");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void initSession();
    return () => {
      cancelled = true;
    };
  }, [refreshCanonicalContext]);

  const handleTabChange = (tab: PrimaryArenaTab, topicId?: string) => {
    setPrimaryTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    if (topicId) {
      params.set("topic", topicId);
      setActiveTopicId(topicId);
    }
    router.replace(`/student/skills/ai-data?${params.toString()}`);
  };

  const handleSelectTopic = (topicId: string, phase?: string) => {
    const resolved = getTaxonomyTopicById(topicId)?.id || topicId;
    setActiveTopicId(resolved);
    if (phase === "practical_lab") {
      handleTabChange("practical-labs", resolved);
      return;
    }
    if (phase === "assessment") {
      handleTabChange("assessments", resolved);
      return;
    }
    setPrimaryTab("learn");
    const params = new URLSearchParams(window.location.search);
    params.set("tab", "learn");
    params.set("topic", resolved);
    router.replace(`/student/skills/ai-data?${params.toString()}`);
  };

  const handleSelectSubject = (subjectId: string) => {
    const subj = TAXONOMY_SUBJECTS.find((s) => s.id === subjectId);
    const firstTopic = subj?.modules?.[0]?.topics?.[0];
    if (firstTopic) {
      handleSelectTopic(firstTopic.id);
    } else {
      handleTabChange("learn");
    }
  };

  const handleSelectRole = async (role: TargetRoleSlug) => {
    setActiveRole(role);
    const params = new URLSearchParams(window.location.search);
    params.set("role", role);
    router.replace(`/student/skills/ai-data?${params.toString()}`);

    try {
      await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_role", candidateId, role }),
      });
      await refreshCanonicalContext(candidateId);
    } catch {
      // Background sync
    }
  };

  const handleLanguageChange = async (nextLang: "english" | "hinglish") => {
    setLanguage(nextLang);
    try {
      await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_language_preference", candidateId, language: nextLang }),
      });
    } catch {
      // Ignore transient network failure
    }
  };

  // Compute lock reasons & remediation alerts directly from authoritative canonicalRoadmap
  const { lockedTopicReasons, remediationTopicIds } = useMemo(() => {
    const locked: Record<string, string> = {};
    const remediation: string[] = [];
    if (canonicalRoadmap) {
      for (const subj of canonicalRoadmap.subjects) {
        for (const node of subj.topics) {
          if (node.lockState === "LOCKED" && node.lockReason) {
            locked[node.topicId] = node.lockReason;
          } else if (node.lockState === "LOCKED") {
            locked[node.topicId] = "Complete previous prerequisite topics first.";
          }
          if (node.lockState === "REMEDIATION_REQUIRED") {
            remediation.push(node.topicId);
          }
        }
      }
    }
    return { lockedTopicReasons: locked, remediationTopicIds: remediation };
  }, [canonicalRoadmap]);

  // Resolve current active topic location
  const topicLocation = useMemo(() => getTopicLocation(activeTopicId), [activeTopicId]);
  const allTopics = useMemo(() => getAllCurriculumTopicsFlat(), []);
  const fallbackTopic = TAXONOMY_SUBJECTS[0].modules[0].topics[0];
  const currentTopic = topicLocation?.topic || getTaxonomyTopicById("py-01-intro-interpreter") || fallbackTopic;
  const currentSubject =
    topicLocation?.subject || TAXONOMY_SUBJECTS[0];
  const currentModule =
    topicLocation?.module || currentSubject.modules[0];

  const masteredCount = canonicalRoadmap?.masteredCount || 0;
  const completedCount = canonicalRoadmap?.completedCount || completedTopicIds.length;
  const masteryPercentage = Math.round((completedCount / (allTopics.length || 1)) * 100);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F6F5F1",
        color: "#17191C",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <AppNav role="student" />

      {/* ── SECONDARY APPLICATION SUBHEADER & 9-TAB ARCHITECTURE ── */}
      <header
        style={{
          borderBottom: "1px solid #E4E1DA",
          backgroundColor: "#FFFFFF",
          padding: "10px 24px",
          position: "sticky",
          top: 56,
          zIndex: 30,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {/* Breadcrumbs */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <Link
              href="/skill-practice"
              style={{ color: "#667085", textDecoration: "none", fontWeight: 600 }}
            >
              ← Skill Practice Hub
            </Link>
            <span style={{ color: "#D0D5DD" }}>/</span>
            <span style={{ color: "#162A43", fontWeight: 800 }}>AI &amp; Data Mastery Arena</span>
            <span
              style={{
                fontSize: 10,
                background: "#F5F3FF",
                color: "#6D28D9",
                padding: "2px 8px",
                borderRadius: 4,
                fontWeight: 700,
                border: "1px solid #DDD6FE",
              }}
            >
              {allTopics.length} Sequential Topics
            </span>
          </div>

          {/* Live Mastery Metrics + Language + AI Learning Mentor */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11.5,
                color: "#667085",
              }}
            >
              <span>{loading ? "Syncing..." : "Verified Mastery:"}</span>
              <strong style={{ color: "#6D28D9" }}>
                {completedCount}/{allTopics.length} ({masteryPercentage}%)
              </strong>
              {masteredCount > 0 && (
                <span style={{ color: "#2E7D5B", fontWeight: 700 }}>
                  · {masteredCount} Mastered
                </span>
              )}
            </div>

            <div
              style={{
                display: "inline-flex",
                background: "#F6F5F1",
                border: "1px solid #E4E1DA",
                borderRadius: 6,
                padding: 2,
              }}
            >
              {(["english", "hinglish"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => void handleLanguageChange(lang)}
                  style={{
                    padding: "4px 9px",
                    borderRadius: 4,
                    border: "none",
                    background: language === lang ? "#FFFFFF" : "transparent",
                    color: language === lang ? "#6D28D9" : "#667085",
                    fontSize: 11,
                    fontWeight: language === lang ? 700 : 600,
                    cursor: "pointer",
                  }}
                >
                  {lang === "english" ? "EN" : "Hinglish"}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsAiMentorOpen((prev) => !prev)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #DDD6FE",
                background: isAiMentorOpen ? "#6D28D9" : "#F5F3FF",
                color: isAiMentorOpen ? "#FFFFFF" : "#6D28D9",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease",
              }}
            >
              <span>🤖</span>
              <span>{isAiMentorOpen ? "Close AI Mentor" : "AI Learning Mentor"}</span>
            </button>
          </div>
        </div>

        {/* ── 9 PRIMARY INFORMATION ARCHITECTURE TABS ── */}
        <nav
          aria-label="AI and Data Arena Sections"
          style={{
            display: "flex",
            gap: 4,
            marginTop: 10,
            paddingTop: 8,
            borderTop: "1px solid #F0EFEA",
            overflowX: "auto",
          }}
        >
          {[
            { id: "overview", label: "Overview", icon: "🧭" },
            { id: "roadmap", label: "My Learning Path", icon: "🧬" },
            { id: "learn", label: "Learn", icon: "📖" },
            { id: "coding-arena", label: "Coding Studio", icon: "⚡" },
            { id: "practical-labs", label: "Practical Labs", icon: "🔬" },
            { id: "assessments", label: "Assessments", icon: "🎯" },
            { id: "projects", label: "Projects", icon: "🚀" },
            { id: "notes", label: "Notes & Revision", icon: "📝" },
            { id: "dna", label: "Progress & Student DNA", icon: "🏆" },
          ].map((tab) => {
            const isSelected = primaryTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id as PrimaryArenaTab)}
                style={{
                  padding: "7px 12px",
                  border: "none",
                  borderBottom: isSelected ? "2.5px solid #6D28D9" : "2.5px solid transparent",
                  background: isSelected ? "#F5F3FF" : "transparent",
                  color: isSelected ? "#162A43" : "#667085",
                  borderRadius: "6px 6px 0 0",
                  fontSize: 12,
                  fontWeight: isSelected ? 800 : 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* ── PRIMARY TAB VIEWS ── */}

      {/* 1. OVERVIEW */}
      {primaryTab === "overview" && (
        <ArenaOverviewDashboard
          candidateId={candidateId}
          activeRole={activeRole}
          completedTopicIds={completedTopicIds}
          canonicalRoadmap={canonicalRoadmap}
          topicMasteryMap={topicMasteryMap}
          learningPosition={learningPosition}
          onSelectTopic={handleSelectTopic}
          onSelectSubject={handleSelectSubject}
          onOpenRoadmap={() => handleTabChange("roadmap")}
          onOpenCodingArena={(topId) => handleTabChange("coding-arena", topId)}
          onOpenPracticalLabs={(topId) => handleTabChange("practical-labs", topId)}
          onOpenAssessments={(topId) => handleTabChange("assessments", topId)}
          onOpenProjects={() => handleTabChange("projects")}
          onOpenNotes={(topId) => handleTabChange("notes", topId)}
          onSelectRole={handleSelectRole}
        />
      )}

      {/* 2. MY LEARNING PATH (TARGET ROLES, DIAGNOSTIC, PREREQUISITE DAG) */}
      {primaryTab === "roadmap" && (
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "24px 16px" }}>
          <CanonicalLearningPathView
            candidateId={candidateId}
            activeRole={activeRole}
            canonicalRoadmap={canonicalRoadmap}
            onSelectRole={handleSelectRole}
            onSelectTopic={(tId) => handleSelectTopic(tId)}
            onRefreshContext={() => refreshCanonicalContext(candidateId)}
          />
        </div>
      )}

      {/* 3. LEARN (SEQUENTIAL MICRO-LEARNING, COMPREHENSION, PRACTICAL LAB & ASSESSMENT) */}
      {primaryTab === "learn" && (
        <div style={{ display: "flex", minHeight: "calc(100vh - 150px)" }}>
          <MasterCurriculumSidebar
            activeTopicId={currentTopic.id}
            completedTopicIds={completedTopicIds}
            lockedTopicReasons={lockedTopicReasons}
            remediationTopicIds={remediationTopicIds}
            activeRole={activeRole}
            onSelectTopic={(tId) => handleSelectTopic(tId)}
            onSelectRole={handleSelectRole}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          />

          <main
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#F6F5F1",
              overflowX: "hidden",
            }}
          >
            <SequentialMicroLearningWorkspace
              topic={currentTopic}
              subject={currentSubject}
              module={currentModule}
              candidateId={candidateId}
              activeRole={activeRole}
              language={language}
              masteryRecord={topicMasteryMap[currentTopic.id]}
              isLocked={Boolean(lockedTopicReasons[currentTopic.id])}
              lockReason={lockedTopicReasons[currentTopic.id]}
              onLanguageChange={handleLanguageChange}
              onNavigateTopic={(tId) => handleSelectTopic(tId)}
              onOpenAiMentor={() => setIsAiMentorOpen(true)}
              onContextUpdate={setMentorTelemetry}
              onRefreshContext={() => refreshCanonicalContext(candidateId)}
            />
          </main>
        </div>
      )}

      {/* 4. CODING STUDIO */}
      {primaryTab === "coding-arena" && (
        <GlobalCodingArena
          initialTopicId={searchParams.get("topic") || undefined}
          candidateId={candidateId}
          onNavigateToTopic={(topId) => handleSelectTopic(topId)}
          onEvidenceRecorded={() => {
            void refreshCanonicalContext(candidateId);
          }}
        />
      )}

      {/* 5. PRACTICAL LABS */}
      {primaryTab === "practical-labs" && (
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "24px 16px" }}>
          <PracticalLabsHub
            candidateId={candidateId}
            initialTopicId={searchParams.get("topic") || currentTopic.id}
            onRefreshContext={() => refreshCanonicalContext(candidateId)}
            onNavigateTopic={(topId) => handleSelectTopic(topId)}
          />
        </div>
      )}

      {/* 6. ASSESSMENTS */}
      {primaryTab === "assessments" && (
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "24px 16px" }}>
          <IntegratedAssessmentsHub
            candidateId={candidateId}
            initialTopicId={searchParams.get("topic") || currentTopic.id}
            canonicalRoadmap={canonicalRoadmap}
            onRefreshContext={() => refreshCanonicalContext(candidateId)}
            onNavigateTopic={(topId) => handleSelectTopic(topId)}
          />
        </div>
      )}

      {/* 7. PROJECTS */}
      {primaryTab === "projects" && (
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "24px 16px" }}>
          <AppliedProjectsHub
            candidateId={candidateId}
            onBackToOverview={() => handleTabChange("overview")}
            onRefreshContext={() => refreshCanonicalContext(candidateId)}
          />
        </div>
      )}

      {/* 8. NOTES & REVISION */}
      {primaryTab === "notes" && (
        <GlobalNotesLibrary
          initialTopicId={currentTopic.id}
          candidateId={candidateId}
          topicMasteryMap={topicMasteryMap}
          onNavigateToTopic={(topId) => handleSelectTopic(topId)}
          onOpenPractice={(topId) => handleTabChange("coding-arena", topId)}
        />
      )}

      {/* 9. PROGRESS & STUDENT DNA */}
      {primaryTab === "dna" && (
        <ArenaDnaProgressView
          candidateId={candidateId}
          activeRole={activeRole}
          completedTopicIds={completedTopicIds}
          topicMasteryMap={topicMasteryMap}
          onOpenTopic={(topId) => handleSelectTopic(topId)}
          onOpenCodingArena={(topId) => handleTabChange("coding-arena", topId)}
        />
      )}

      {/* Context-Aware AI Learning Mentor Drawer */}
      <ContextualAiMentorDrawer
        isOpen={isAiMentorOpen}
        onClose={() => setIsAiMentorOpen(false)}
        candidateId={candidateId}
        topic={currentTopic}
        subject={currentSubject}
        moduleTitle={currentModule.title}
        subtopicTitle={mentorTelemetry.subtopicTitle}
        learningPhase={mentorTelemetry.learningPhase}
        language={language}
        userCode={mentorTelemetry.userCode}
        executionStdout={mentorTelemetry.executionStdout}
        executionStderr={mentorTelemetry.executionStderr}
        weakConcepts={mentorTelemetry.weakConcepts}
        assessmentScore={mentorTelemetry.assessmentScore}
        targetRole={activeRole}
      />
    </div>
  );
}

export default function AiDataArenaPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#F6F5F1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#667085",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Loading AI &amp; Data Mastery Arena...
        </div>
      }
    >
      <AiDataArenaMain />
    </Suspense>
  );
}
