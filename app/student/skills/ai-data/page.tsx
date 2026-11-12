"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import MasterCurriculumSidebar from "@/components/skills/ai-data/MasterCurriculumSidebar";
import FocusedTopicWorkspace from "@/components/skills/ai-data/FocusedTopicWorkspace";
import ContextualAiMentorDrawer from "@/components/skills/ai-data/ContextualAiMentorDrawer";
import PersonalizedRoadmapView from "@/components/skills/ai-data/PersonalizedRoadmapView";
import GlobalCodingArena from "@/components/skills/ai-data/GlobalCodingArena";
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
import { TargetRoleSlug } from "@/lib/skills/ai-data/types";

export type PrimaryArenaTab =
  | "overview"
  | "roadmap"
  | "learn"
  | "coding-arena"
  | "projects"
  | "notes"
  | "dna";

function AiDataArenaMain() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Core identification
  const [candidateId, setCandidateId] = useState<string>("student-demo");
  const [activeRole, setActiveRole] = useState<TargetRoleSlug>("ai_engineer");
  const [primaryTab, setPrimaryTab] = useState<PrimaryArenaTab>("overview");
  const [activeTopicId, setActiveTopicId] = useState<string>("py-01-intro");
  const [completedTopicIds, setCompletedTopicIds] = useState<string[]>([]);

  // UI States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAiMentorOpen, setIsAiMentorOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize from Session, URL params & localStorage
  useEffect(() => {
    async function initSession() {
      try {
        const sessRes = await fetch("/api/auth/session");
        const sess = await sessRes.json();
        const cid =
          sess?.user?.id ||
          (typeof window !== "undefined" ? localStorage.getItem("cognalyze_student_id") : null) ||
          "student-demo";
        setCandidateId(cid);

        // Fetch candidate progress
        const progRes = await fetch(`/api/skills/ai-data?candidateId=${cid}`);
        const progData = await progRes.json();
        if (progData.summary?.completedLessons) {
          setCompletedTopicIds(progData.summary.completedLessons);
        } else if (typeof window !== "undefined") {
          const localCompleted = localStorage.getItem(`cognalyze_completed_topics_${cid}`);
          if (localCompleted) {
            setCompletedTopicIds(JSON.parse(localCompleted));
          }
        }

        if (progData.candidateRole) {
          setActiveRole(progData.candidateRole);
        }
      } catch (e) {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    initSession();
  }, []);

  // Sync URL search params
  useEffect(() => {
    const paramTab = searchParams.get("tab") as PrimaryArenaTab;
    const paramTopic = searchParams.get("topic");
    const paramRole = searchParams.get("role") as TargetRoleSlug;

    if (
      paramTab &&
      ["overview", "roadmap", "learn", "coding-arena", "projects", "notes", "dna"].includes(paramTab)
    ) {
      setPrimaryTab(paramTab);
    }
    if (paramTopic) {
      setActiveTopicId(paramTopic);
    }
    if (paramRole) {
      setActiveRole(paramRole);
    }
  }, [searchParams]);

  const handleTabChange = (tab: PrimaryArenaTab, topicId?: string) => {
    setPrimaryTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    if (topicId) {
      params.set("topic", topicId);
      setActiveTopicId(topicId);
    } else {
      params.delete("topic");
    }
    router.replace(`/student/skills/ai-data?${params.toString()}`);
  };

  // Handle topic selection
  const handleSelectTopic = (topicId: string) => {
    setActiveTopicId(topicId);
    setPrimaryTab("learn");
    const params = new URLSearchParams(window.location.search);
    params.set("tab", "learn");
    params.set("topic", topicId);
    router.replace(`/student/skills/ai-data?${params.toString()}`);
  };

  // Handle subject selection from overview
  const handleSelectSubject = (subjectId: string) => {
    const subj = TAXONOMY_SUBJECTS.find((s) => s.id === subjectId);
    const firstTopic = subj?.modules?.[0]?.topics?.[0];
    if (firstTopic) {
      handleSelectTopic(firstTopic.id);
    } else {
      setPrimaryTab("learn");
    }
  };

  // Handle role selection
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
    } catch (e) {
      // Background sync
    }
  };

  // Handle topic completion
  const handleTopicComplete = (topicId: string) => {
    setCompletedTopicIds((prev) => {
      if (prev.includes(topicId)) return prev;
      const updated = [...prev, topicId];
      if (typeof window !== "undefined") {
        localStorage.setItem(`cognalyze_completed_topics_${candidateId}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Resolve current active topic location
  const topicLocation = useMemo(() => {
    return getTopicLocation(activeTopicId);
  }, [activeTopicId]);

  const currentTopic = topicLocation?.topic || getTaxonomyTopicById("py-01-intro")!;
  const currentSubject =
    topicLocation?.subject || {
      id: "subj_python",
      slug: "python",
      title: "Python Foundations & Advanced Engineering",
      icon: "🐍",
      badge: "Programming",
      description: "CPython virtual machine, dynamic typing, control flow, data structures, and OOP.",
      estimatedHours: 40,
      prerequisites: [],
      modules: [],
    };
  const currentModule =
    topicLocation?.module || {
      id: "mod_py_foundations",
      trackId: "track_python",
      title: "Module 1: Introduction to Python & Interpreter",
      description: "CPython VM and execution lifecycle",
      order: 1,
      topics: [currentTopic],
    };

  const allTopics = useMemo(() => getAllCurriculumTopicsFlat(), []);
  const masteryPercentage = Math.round((completedTopicIds.length / (allTopics.length || 1)) * 100);

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

      {/* ── SECONDARY APPLICATION SUBHEADER & BREADCRUMBS ── */}
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
            <span style={{ color: "#162A43", fontWeight: 800 }}>AI &amp; Data Arena</span>
            <span
              style={{
                fontSize: 10,
                background: "#EFF4FE",
                color: "#356AE6",
                padding: "2px 7px",
                borderRadius: 4,
                fontWeight: 700,
                border: "1px solid #D2E0FB",
              }}
            >
              154 Canonical Topics
            </span>
          </div>

          {/* Quick Metrics & Socratic Assistant Trigger */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                color: "#667085",
              }}
            >
              <span>Demonstrated Evidence:</span>
              <strong style={{ color: "#2E7D5B" }}>
                {completedTopicIds.length}/{allTopics.length} ({masteryPercentage}%)
              </strong>
            </div>

            <button
              onClick={() => setIsAiMentorOpen((prev) => !prev)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #D2E0FB",
                background: isAiMentorOpen ? "#162A43" : "#EFF4FE",
                color: isAiMentorOpen ? "#FFFFFF" : "#356AE6",
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
              <span>{isAiMentorOpen ? "Close AI Mentor" : "Socratic AI Mentor"}</span>
            </button>
          </div>
        </div>

        {/* ── 7 PRIMARY INFORMATION ARCHITECTURE TABS ── */}
        <div
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
            { id: "roadmap", label: "Customized Roadmap", icon: "🧬" },
            { id: "learn", label: "Learn", icon: "📖" },
            { id: "coding-arena", label: "Coding Arena", icon: "⚡" },
            { id: "projects", label: "Projects", icon: "🚀" },
            { id: "notes", label: "Notes & Revision", icon: "📝" },
            { id: "dna", label: "Progress & Student DNA", icon: "🏆" },
          ].map((tab) => {
            const isSelected = primaryTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as PrimaryArenaTab)}
                style={{
                  padding: "7px 14px",
                  border: "none",
                  borderBottom: isSelected ? "2.5px solid #356AE6" : "2.5px solid transparent",
                  background: isSelected ? "#EFF4FE" : "transparent",
                  color: isSelected ? "#162A43" : "#667085",
                  borderRadius: "6px 6px 0 0",
                  fontSize: 12.5,
                  fontWeight: isSelected ? 800 : 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ── PRIMARY TAB VIEWS ── */}

      {/* 1. OVERVIEW DASHBOARD */}
      {primaryTab === "overview" && (
        <ArenaOverviewDashboard
          candidateId={candidateId}
          activeRole={activeRole}
          completedTopicIds={completedTopicIds}
          onSelectSubject={handleSelectSubject}
          onOpenRoadmap={() => handleTabChange("roadmap")}
          onOpenCodingArena={(topId) => handleTabChange("coding-arena", topId)}
          onOpenNotes={(topId) => handleTabChange("notes", topId)}
          onSelectRole={handleSelectRole}
        />
      )}

      {/* 2. CUSTOMIZED ROADMAP (GLOBALLY ACCESSIBLE) */}
      {primaryTab === "roadmap" && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
          <PersonalizedRoadmapView
            candidateId={candidateId}
            initialRole={activeRole}
            onSelectTopic={(tSlug) => handleSelectTopic(tSlug)}
            onLaunchVisualStudio={(tSlug) => handleSelectTopic(tSlug)}
          />
        </div>
      )}

      {/* 3. LEARN & FOCUSED SUBJECT NAVIGATION */}
      {primaryTab === "learn" && (
        <div style={{ display: "flex", minHeight: "calc(100vh - 145px)" }}>
          {/* Left Hierarchical Curriculum Tree */}
          <MasterCurriculumSidebar
            activeTopicId={activeTopicId}
            completedTopicIds={completedTopicIds}
            activeRole={activeRole}
            onSelectTopic={handleSelectTopic}
            onSelectRole={handleSelectRole}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          />

          {/* Right Focused Learning Workspace */}
          <main
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#F6F5F1",
              overflowX: "hidden",
            }}
          >
            <FocusedTopicWorkspace
              topic={currentTopic}
              subject={currentSubject}
              module={currentModule}
              candidateId={candidateId}
              activeRole={activeRole}
              isCompleted={completedTopicIds.includes(currentTopic.id)}
              onTopicComplete={handleTopicComplete}
              onNavigateTopic={handleSelectTopic}
              onOpenAiMentor={() => setIsAiMentorOpen(true)}
              onOpenCodingArena={(topId) => handleTabChange("coding-arena", topId)}
            />
          </main>
        </div>
      )}

      {/* 4. FIRST-CLASS CODING ARENA */}
      {primaryTab === "coding-arena" && (
        <GlobalCodingArena
          initialTopicId={searchParams.get("topic") || undefined}
          candidateId={candidateId}
          onNavigateToTopic={(topId) => handleSelectTopic(topId)}
          onEvidenceRecorded={(challenge, score) => {
            // Update topic completed if score >= 75
            if (score >= 75) {
              handleTopicComplete(challenge.topicId);
            }
          }}
        />
      )}

      {/* 5. APPLIED PROJECTS */}
      {primaryTab === "projects" && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
          <AppliedProjectsHub
            candidateId={candidateId}
            onBackToOverview={() => handleTabChange("overview")}
          />
        </div>
      )}

      {/* 6. GLOBAL NOTES & REVISION */}
      {primaryTab === "notes" && (
        <GlobalNotesLibrary
          initialTopicId={activeTopicId}
          candidateId={candidateId}
          onNavigateToTopic={(topId) => handleSelectTopic(topId)}
          onOpenPractice={(topId) => handleTabChange("coding-arena", topId)}
        />
      )}

      {/* 7. PROGRESS & STUDENT DNA */}
      {primaryTab === "dna" && (
        <ArenaDnaProgressView
          candidateId={candidateId}
          activeRole={activeRole}
          completedTopicIds={completedTopicIds}
          onOpenTopic={(topId) => handleSelectTopic(topId)}
          onOpenCodingArena={(topId) => handleTabChange("coding-arena", topId)}
        />
      )}

      {/* Contextual Socratic AI Mentor Drawer */}
      <ContextualAiMentorDrawer
        isOpen={isAiMentorOpen}
        onClose={() => setIsAiMentorOpen(false)}
        topic={currentTopic}
        subject={currentSubject}
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
          Loading AI &amp; Data Arena...
        </div>
      }
    >
      <AiDataArenaMain />
    </Suspense>
  );
}
