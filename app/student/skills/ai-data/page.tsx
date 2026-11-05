"use client";

import React, { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppNav from "@/components/AppNav";
import { useTheme } from "@/components/ThemeProvider";
import {
  AiDataTrackSlug,
  TargetRoleSlug,
  TargetRoleProfile,
  AiDataTrack,
  AiDataLesson,
  AiDataArenaSummary
} from "@/lib/skills/ai-data/types";
import { TARGET_ROLE_PROFILES } from "@/lib/skills/ai-data/roles";
import { AI_DATA_TRACKS } from "@/lib/skills/ai-data/curriculum";
import { PRACTICAL_CHALLENGES, PracticalChallenge } from "@/lib/skills/ai-data/challenges-bank";
import HierarchicalSidebar from "@/components/skills/ai-data/HierarchicalSidebar";
import AiTeacherWorkspace from "@/components/skills/ai-data/AiTeacherWorkspace";
import FreshProblemLauncher from "@/components/skills/ai-data/FreshProblemLauncher";
import HistoricalInterviewBankView from "@/components/skills/ai-data/HistoricalInterviewBankView";
import DryRunStudioModal from "@/components/skills/ai-data/DryRunStudioModal";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import { getTopicTeacherPackage } from "@/lib/skills/ai-data/ai-teacher-engine";

type WorkspaceMode = "learn" | "teacher" | "practice" | "fresh" | "company_prep" | "dry_run" | "coach" | "interview";

function AiDataArenaContent() {
  const { isDark } = useTheme();
  const searchParams = useSearchParams();

  const [candidateId, setCandidateId] = useState<string>("student-demo");
  const [selectedRole, setSelectedRole] = useState<TargetRoleSlug>("ai_engineer");
  const [activeTrackSlug, setActiveTrackSlug] = useState<AiDataTrackSlug>("genai_llm");
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("learn");
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<AiDataArenaSummary | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<AiDataLesson | null>(
    () => AI_DATA_TRACKS.genai_llm.stages[0]?.lessons[0] || null
  );
  const [selectedChallenge, setSelectedChallenge] = useState<PracticalChallenge | null>(
    () => Object.values(PRACTICAL_CHALLENGES)[0] || null
  );
  const [showRoleGaps, setShowRoleGaps] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  const activeRoleProfile: TargetRoleProfile = TARGET_ROLE_PROFILES[selectedRole] || TARGET_ROLE_PROFILES.ai_engineer;
  const activeTrack: AiDataTrack = AI_DATA_TRACKS[activeTrackSlug] || AI_DATA_TRACKS.genai_llm;
  const allTracks = useMemo(() => Object.values(AI_DATA_TRACKS), []);
  const allRoles = useMemo(() => Object.values(TARGET_ROLE_PROFILES), []);
  const allChallenges = useMemo(() => Object.values(PRACTICAL_CHALLENGES), []);

  // Synchronize URL query parameters without full page reload
  const updateUrlParams = useCallback((track: string, topic?: string, mode?: string) => {
    if (typeof window === "undefined") return;
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("track", track);
    if (topic) currentUrl.searchParams.set("topic", topic);
    else currentUrl.searchParams.delete("topic");
    if (mode) currentUrl.searchParams.set("mode", mode);
    window.history.pushState(null, "", currentUrl.toString());
  }, []);

  // Initial user & URL state restoration
  useEffect(() => {
    async function initUser() {
      try {
        const sessRes = await fetch("/api/auth/session");
        const sess = await sessRes.json();
        const cid = (sess.authenticated && sess.user?.id) ? sess.user.id : "u-student-sample-001";
        setCandidateId(cid);

        const urlRole = searchParams.get("role") as TargetRoleSlug;
        const urlTrack = (searchParams.get("track") as AiDataTrackSlug) || "genai_llm";
        const urlTopic = searchParams.get("topic");
        const urlMode = searchParams.get("mode") as WorkspaceMode;

        if (urlRole && TARGET_ROLE_PROFILES[urlRole]) {
          setSelectedRole(urlRole);
        }
        if (urlTrack && AI_DATA_TRACKS[urlTrack]) {
          setActiveTrackSlug(urlTrack);
        }
        if (urlMode && ["learn", "teacher", "practice", "fresh", "company_prep", "dry_run", "coach", "interview"].includes(urlMode)) {
          setWorkspaceMode(urlMode);
        }

        // Resolve active topic
        const targetTrack = AI_DATA_TRACKS[urlTrack] || AI_DATA_TRACKS.genai_llm;
        if (urlTopic) {
          let found: AiDataLesson | null = null;
          for (const stg of targetTrack.stages) {
            const match = stg.lessons.find((l) => l.slug === urlTopic);
            if (match) {
              found = match;
              break;
            }
          }
          if (found) {
            setSelectedLesson(found);
          } else {
            setSelectedLesson(targetTrack.stages[0]?.lessons[0] || null);
          }
        } else {
          setSelectedLesson(targetTrack.stages[0]?.lessons[0] || null);
        }

        fetchArenaData(cid, urlRole || undefined, urlTrack || undefined);
      } catch {
        fetchArenaData("u-student-sample-001");
      }
    }
    initUser();
  }, [searchParams]);

  // Handle browser back/forward history navigation
  useEffect(() => {
    const handlePopState = () => {
      const currentUrl = new URL(window.location.href);
      const urlTrack = (currentUrl.searchParams.get("track") as AiDataTrackSlug) || activeTrackSlug;
      const urlTopic = currentUrl.searchParams.get("topic");
      const urlMode = (currentUrl.searchParams.get("mode") as WorkspaceMode) || "learn";

      if (urlTrack && AI_DATA_TRACKS[urlTrack]) {
        setActiveTrackSlug(urlTrack);
        const trk = AI_DATA_TRACKS[urlTrack];
        if (urlTopic) {
          for (const stg of trk.stages) {
            const match = stg.lessons.find((l) => l.slug === urlTopic);
            if (match) {
              setSelectedLesson(match);
              break;
            }
          }
        }
      }
      setWorkspaceMode(urlMode);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [activeTrackSlug]);

  const fetchArenaData = async (cid: string, role?: TargetRoleSlug, track?: AiDataTrackSlug) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("candidateId", cid);
      if (role) params.set("role", role);
      if (track) params.set("track", track);

      const res = await fetch(`/api/skills/ai-data?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        if (data.selectedRole) setSelectedRole(data.selectedRole);
        if (data.activeTrackSlug) setActiveTrackSlug(data.activeTrackSlug);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load AI & Data Arena data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (role: TargetRoleSlug) => {
    setSelectedRole(role);
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_role", candidateId, role })
      });
      const data = await res.json();
      if (data.success && data.summary) {
        setSummary(data.summary);
        const roleProfile = TARGET_ROLE_PROFILES[role];
        if (roleProfile) {
          setActiveTrackSlug(roleProfile.primaryTrack);
          const newTrack = AI_DATA_TRACKS[roleProfile.primaryTrack];
          const firstLesson = newTrack?.stages[0]?.lessons[0] || null;
          setSelectedLesson(firstLesson);
          updateUrlParams(roleProfile.primaryTrack, firstLesson?.slug, workspaceMode);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTrackSelect = async (track: AiDataTrackSlug) => {
    setActiveTrackSlug(track);
    const trk = AI_DATA_TRACKS[track];
    const firstLesson = trk?.stages[0]?.lessons[0] || null;
    setSelectedLesson(firstLesson);
    updateUrlParams(track, firstLesson?.slug, workspaceMode);

    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_track", candidateId, track })
      });
      const data = await res.json();
      if (data.success && data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTopicSelect = (topicSlug: string, lesson: AiDataLesson) => {
    setSelectedLesson(lesson);
    // If student was in fresh/company_prep, return to learn mode
    const nextMode = ["fresh", "company_prep", "dry_run"].includes(workspaceMode) ? "learn" : workspaceMode;
    setWorkspaceMode(nextMode);
    updateUrlParams(activeTrackSlug, topicSlug, nextMode);
  };

  const handleModeChange = (mode: WorkspaceMode) => {
    setWorkspaceMode(mode);
    updateUrlParams(activeTrackSlug, selectedLesson?.slug, mode);
  };

  const handleLaunchStudio = (studioTarget: string) => {
    if (studioTarget === "sql_lab") {
      window.location.href = "/student/skills/ai-data/lab?tab=sql";
    } else if (studioTarget === "python_sandbox") {
      window.location.href = "/student/skills/ai-data/lab?tab=python";
    } else if (studioTarget === "agent_builder") {
      window.location.href = "/student/skills/ai-data/agent-builder";
    } else if (studioTarget === "pipeline_builder") {
      window.location.href = "/student/skills/ai-data/pipeline-builder";
    } else if (studioTarget === "ml_studio") {
      setWorkspaceMode("practice");
    } else if (studioTarget === "dry_run") {
      setWorkspaceMode("dry_run");
    }
  };

  // Challenges matching current active track & canonical skill
  const trackChallenges = useMemo(() => {
    return allChallenges.filter((c) => c.trackSlug === activeTrackSlug);
  }, [allChallenges, activeTrackSlug]);

  const currentTopicChallenges = useMemo(() => {
    if (!selectedLesson) return trackChallenges;
    return trackChallenges.filter(
      (c) =>
        c.canonicalSkill.toLowerCase() === selectedLesson.canonicalSkill.toLowerCase() ||
        c.category.includes(selectedLesson.exerciseType === "sql_lab" ? "sql" : "python")
    );
  }, [trackChallenges, selectedLesson]);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: isDark ? "#0A0F1D" : "#F7F9FC",
        color: isDark ? "#F2F6FC" : "#17191C",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      <AppNav role="student" />

      {/* ── TOP UTILITY & BREADCRUMB BAR (Compact, 46px) ── */}
      <header
        style={{
          height: 46,
          flexShrink: 0,
          borderBottom: `1px solid ${isDark ? "#1E2A3B" : "#E2E8F0"}`,
          backgroundColor: isDark ? "#0E1726" : "#FFFFFF",
          padding: "0 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 30
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              padding: "4px 8px",
              borderRadius: 5,
              backgroundColor: isDark ? "#16253C" : "#F1F5F9",
              border: `1px solid ${isDark ? "#2A3F5F" : "#CBD5E1"}`,
              color: isDark ? "#CBD5E1" : "#334155",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
            title="Toggle Curriculum Sidebar"
          >
            <span>{sidebarCollapsed ? "▶" : "◀"}</span>
            <span>Curriculum</span>
          </button>

          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
            <span style={{ color: isDark ? "#8FA0B8" : "#64748B" }}>AI &amp; Data Arena</span>
            <span style={{ color: isDark ? "#4B5563" : "#CBD5E1" }}>/</span>
            <span style={{ color: "#356AE6", fontWeight: 700 }}>
              {activeTrack.icon} {activeTrack.title}
            </span>
            {selectedLesson && (
              <>
                <span style={{ color: isDark ? "#4B5563" : "#CBD5E1" }}>/</span>
                <span style={{ color: isDark ? "#FFFFFF" : "#0F172A", fontWeight: 700, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {selectedLesson.title}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right Utility: Target Role, DNA Readiness & Studios */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#8FA0B8" : "#64748B" }}>
              Target Role:
            </span>
            <select
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value as TargetRoleSlug)}
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 8px",
                borderRadius: 5,
                backgroundColor: isDark ? "#16253C" : "#F1F5F9",
                border: `1px solid ${isDark ? "#2A3F5F" : "#CBD5E1"}`,
                color: isDark ? "#FFFFFF" : "#0F172A",
                cursor: "pointer"
              }}
            >
              {allRoles.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.icon} {r.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowRoleGaps(!showRoleGaps)}
            style={{
              padding: "4px 10px",
              borderRadius: 5,
              backgroundColor: isDark ? "#162E20" : "#ECFDF5",
              border: "1px solid #10B981",
              color: "#047857",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            🎯 DNA Gaps ({summary?.dnaSkillGaps?.filter((g) => g.gapStatus !== "ALIGNED").length || 0})
          </button>
        </div>
      </header>

      {/* ── COLLAPSIBLE ROLE GAPS DRAWER ── */}
      {showRoleGaps && summary?.dnaSkillGaps && (
        <div
          style={{
            backgroundColor: isDark ? "#0E1726" : "#FFFFFF",
            borderBottom: `1px solid ${isDark ? "#1E2A3B" : "#E2E8F0"}`,
            padding: "10px 18px",
            zIndex: 25,
            flexShrink: 0
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase" }}>
              Target Role Competency Alignment: {activeRoleProfile.title} ({summary.completedLessonsCount} / {summary.totalLessonsCount} Lessons Verified)
            </span>
            <button
              onClick={() => setShowRoleGaps(false)}
              style={{ background: "none", border: "none", color: isDark ? "#8FA0B8" : "#64748B", fontSize: 12, cursor: "pointer" }}
            >
              ✕ Close
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
            {summary.dnaSkillGaps.map((g) => (
              <div
                key={g.skillId}
                style={{
                  padding: "6px 8px",
                  borderRadius: 5,
                  backgroundColor: isDark ? "#16253C" : "#F8FAFC",
                  border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
                  fontSize: 11
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                  <span>{g.skillName}</span>
                  <span style={{ color: g.gapStatus === "ALIGNED" ? "#10B981" : g.gapStatus === "CRITICAL" ? "#EF4444" : "#F59E0B" }}>
                    {g.gapStatus}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: isDark ? "#8FA0B8" : "#64748B" }}>
                  Level {g.currentLevel} / {g.targetLevel} Target
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MAIN WORKSPACE BODY: SIDEBAR + BOUNDED TOPIC WORKSPACE ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        
        {/* Hierarchical Persistent Sidebar */}
        <HierarchicalSidebar
          tracks={allTracks}
          activeTrackSlug={activeTrackSlug}
          selectedTopicSlug={selectedLesson?.slug}
          onSelectTrack={handleTrackSelect}
          onSelectTopic={handleTopicSelect}
          onLaunchStudio={handleLaunchStudio}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isDark={isDark}
          targetRoleTrackSlug={activeRoleProfile.primaryTrack}
        />

        {/* ── DEDICATED TOPIC WORKSPACE CONTAINER (Isolated Scrolling) ── */}
        <main
          style={{
            flex: 1,
            height: "100%",
            overflowY: "auto",
            padding: "20px 28px 80px",
            boxSizing: "border-box"
          }}
        >
          {selectedLesson ? (
            <div>
              {/* TOPIC HEADER & METADATA */}
              <div
                style={{
                  backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
                  borderRadius: 8,
                  padding: "16px 20px",
                  marginBottom: 16
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: 4,
                          backgroundColor: "#356AE6",
                          color: "#FFFFFF",
                          textTransform: "uppercase"
                        }}
                      >
                        {selectedLesson.exerciseType.replace(/_/g, " ")}
                      </span>
                      <span style={{ fontSize: 11, color: isDark ? "#8FA0B8" : "#64748B" }}>
                        ⏱️ {selectedLesson.durationMinutes} mins • Canonical: <strong style={{ color: "#10B981" }}>{selectedLesson.canonicalSkill}</strong>
                      </span>
                    </div>
                    <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: isDark ? "#FFFFFF" : "#0F172A" }}>
                      {selectedLesson.title}
                    </h1>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <Link
                      href={
                        selectedLesson.exerciseType === "sql_lab"
                          ? "/student/skills/ai-data/lab?tab=sql"
                          : selectedLesson.exerciseType === "code_lab"
                          ? "/student/skills/ai-data/lab?tab=python"
                          : "/student/skills/ai-data/pipeline-builder"
                      }
                      style={{
                        padding: "7px 14px",
                        borderRadius: 6,
                        backgroundColor: "#356AE6",
                        color: "#FFFFFF",
                        fontSize: 11.5,
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      <span>⚡ Open Interactive Sandbox →</span>
                    </Link>
                  </div>
                </div>

                <p style={{ fontSize: 12.5, color: isDark ? "#B0C0D4" : "#475569", margin: "0 0 12px", lineHeight: 1.5 }}>
                  {selectedLesson.summary}
                </p>

                {/* WORKSPACE MODE SWITCHER TABS */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", borderTop: `1px solid ${isDark ? "#1E2A3B" : "#F1F5F9"}`, paddingTop: 12 }}>
                  {[
                    { id: "learn", label: "📖 Learn & Concepts" },
                    { id: "teacher", label: "🤖 AI Teacher (Modes A-F)", badge: "Co-Build" },
                    { id: "practice", label: "🛠️ Practice Challenges", count: currentTopicChallenges.length },
                    { id: "dry_run", label: "👁️ Visual Dry-Run", badge: "Tracer" },
                    { id: "coach", label: "💡 Socratic AI Coach", badge: "Hints" },
                    { id: "interview", label: "🎯 Interview Exam", badge: "100pt" }
                  ].map((tab) => {
                    const isActive = workspaceMode === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleModeChange(tab.id as WorkspaceMode)}
                        style={{
                          fontSize: 11.5,
                          fontWeight: isActive ? 800 : 600,
                          padding: "6px 12px",
                          borderRadius: 6,
                          backgroundColor: isActive ? "#356AE6" : isDark ? "#16253C" : "#F1F5F9",
                          color: isActive ? "#FFFFFF" : isDark ? "#8FA0B8" : "#475569",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <span>{tab.label}</span>
                        {tab.badge && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 800,
                              padding: "1px 4px",
                              borderRadius: 3,
                              backgroundColor: isActive ? "rgba(255,255,255,0.3)" : isDark ? "#22334A" : "#E2E8F0",
                              color: isActive ? "#FFFFFF" : isDark ? "#94A3B8" : "#64748B"
                            }}
                          >
                            {tab.badge}
                          </span>
                        )}
                        {tab.count !== undefined && (
                          <span style={{ fontSize: 10, opacity: 0.85 }}>({tab.count})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* TAB 1: LEARN & CONCEPTS FOUNDATION                           */}
              {/* ══════════════════════════════════════════════════════════════ */}
              {workspaceMode === "learn" && (
                <div
                  style={{
                    backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                    border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
                    borderRadius: 8,
                    padding: "20px 24px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: isDark ? "#FFFFFF" : "#0F172A" }}>
                      Curriculum Foundation &amp; Technical Deep Dive
                    </h3>
                    <button
                      onClick={() => handleModeChange("teacher")}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 6,
                        backgroundColor: "#10B981",
                        color: "#FFFFFF",
                        border: "none",
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Start Interactive AI Teacher Co-Build (Modes A-F) →
                    </button>
                  </div>

                  <div
                    style={{
                      backgroundColor: isDark ? "#0A0F1D" : "#F8FAFC",
                      border: `1px solid ${isDark ? "#1E2A3B" : "#E2E8F0"}`,
                      borderRadius: 6,
                      padding: "18px 22px",
                      fontSize: 13,
                      lineHeight: 1.65,
                      color: isDark ? "#E2E8F0" : "#1E293B"
                    }}
                  >
                    <MarkdownRenderer content={selectedLesson.contentMarkdown} isDark={isDark} />
                  </div>

                  <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 11.5, color: isDark ? "#8FA0B8" : "#64748B" }}>
                      Verified Canonical Skill: <strong style={{ color: "#356AE6" }}>{selectedLesson.canonicalSkill}</strong>
                    </div>
                    <button
                      onClick={() => handleModeChange("practice")}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 6,
                        backgroundColor: isDark ? "#16253C" : "#EFF4FE",
                        color: "#356AE6",
                        border: "1px solid #356AE6",
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Solve Practical Exercises ({currentTopicChallenges.length}) →
                    </button>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* TAB 2: AI TEACHER CO-CONSTRUCTION (Modes A-F)                 */}
              {/* ══════════════════════════════════════════════════════════════ */}
              {workspaceMode === "teacher" && (
                <AiTeacherWorkspace
                  candidateId={candidateId}
                  teacherPackage={getTopicTeacherPackage(selectedLesson.slug)}
                  onLaunchStudio={handleLaunchStudio}
                />
              )}

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* TAB 3: PRACTICE CHALLENGES (Skill-Calibrated)                 */}
              {/* ══════════════════════════════════════════════════════════════ */}
              {workspaceMode === "practice" && (
                <div
                  style={{
                    backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                    border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
                    borderRadius: 8,
                    padding: "20px 24px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: isDark ? "#FFFFFF" : "#0F172A" }}>
                        Practical Challenges for {selectedLesson.title}
                      </h3>
                      <div style={{ fontSize: 11.5, color: isDark ? "#8FA0B8" : "#64748B", marginTop: 2 }}>
                        {currentTopicChallenges.length} validated problem sets mapped to {selectedLesson.canonicalSkill}
                      </div>
                    </div>
                    <Link
                      href="/student/skills/ai-data/lab"
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: "#356AE6",
                        textDecoration: "none"
                      }}
                    >
                      ⚡ Open All-in-One Execution Sandbox →
                    </Link>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
                    {currentTopicChallenges.map((chal) => (
                      <div
                        key={chal.id}
                        onClick={() => setSelectedChallenge(chal)}
                        style={{
                          border: `1px solid ${isDark ? "#1E2A3B" : "#E2E8F0"}`,
                          borderRadius: 8,
                          padding: "14px 16px",
                          backgroundColor: isDark ? "#0A0F1D" : "#F8FAFC",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          transition: "border-color 0.15s ease"
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span
                              style={{
                                fontSize: 9.5,
                                fontWeight: 800,
                                padding: "2px 6px",
                                borderRadius: 4,
                                backgroundColor: chal.difficulty === "advanced" ? "#FEF2F2" : "#F0FDF4",
                                color: chal.difficulty === "advanced" ? "#DC2626" : "#16A34A"
                              }}
                            >
                              {chal.difficulty.toUpperCase()}
                            </span>
                            <span style={{ fontSize: 10, color: isDark ? "#8FA0B8" : "#64748B" }}>
                              ⏱️ {chal.estimatedMinutes}m
                            </span>
                          </div>
                          <h4 style={{ fontSize: 13, fontWeight: 800, margin: "4px 0", color: isDark ? "#FFFFFF" : "#0F172A" }}>
                            {chal.title}
                          </h4>
                          <p style={{ fontSize: 11.5, color: isDark ? "#8FA0B8" : "#64748B", margin: "2px 0 8px", lineHeight: 1.45 }}>
                            {chal.scenario.slice(0, 110)}...
                          </p>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10.5, borderTop: `1px solid ${isDark ? "#1E2A3B" : "#E2E8F0"}`, paddingTop: 8 }}>
                          <span style={{ color: "#10B981", fontWeight: 700 }}>{chal.provenance.sourceName}</span>
                          <span style={{ color: "#356AE6", fontWeight: 800 }}>Solve Challenge →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* TAB 4: VISUAL DRY-RUN STUDIO                                  */}
              {/* ══════════════════════════════════════════════════════════════ */}
              {workspaceMode === "dry_run" && (
                <DryRunStudioModal />
              )}

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* TAB 5: SOCRATIC AI COACH SCAFFOLDING                          */}
              {/* ══════════════════════════════════════════════════════════════ */}
              {workspaceMode === "coach" && (
                <div
                  style={{
                    backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                    border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
                    borderRadius: 8,
                    padding: "20px 24px"
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 800, color: isDark ? "#FFFFFF" : "#0F172A", marginBottom: 6 }}>
                    💡 Socratic AI Mentor 4-Tier Scaffolding
                  </div>
                  <p style={{ fontSize: 12, color: isDark ? "#8FA0B8" : "#64748B", margin: "0 0 16px" }}>
                    Pedagogically sound guidance calibrated for {selectedLesson.canonicalSkill}. Moves gradually from mathematical theorems to structural hints, code logic nudges, and full solutions.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                    {[
                      { lvl: 1, title: "Level 1: Conceptual Framing", desc: "Mathematical & theoretical foundation. Explains WHY the approach works without writing code." },
                      { lvl: 2, title: "Level 2: Structural Clues", desc: "Decomposes the task into schemas, CTEs, window frames, or DAG nodes." },
                      { lvl: 3, title: "Level 3: Logic Nudges", desc: "Highlights exact clause, operator, parameter, or off-by-one edge case." },
                      { lvl: 4, title: "Level 4: Full Solution Walkthrough", desc: "Reference implementation. Records attempt as assisted in Student DNA." }
                    ].map((tier) => (
                      <div
                        key={tier.lvl}
                        style={{
                          padding: "14px",
                          borderRadius: 6,
                          border: `1px solid ${isDark ? "#1E2A3B" : "#E2E8F0"}`,
                          backgroundColor: isDark ? "#0A0F1D" : "#F8FAFC"
                        }}
                      >
                        <div style={{ fontSize: 11.5, fontWeight: 800, color: "#356AE6", marginBottom: 4 }}>
                          {tier.title}
                        </div>
                        <div style={{ fontSize: 11, color: isDark ? "#8FA0B8" : "#64748B", lineHeight: 1.45 }}>
                          {tier.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 20, textAlign: "center" }}>
                    <Link
                      href={
                        selectedLesson.exerciseType === "sql_lab"
                          ? "/student/skills/ai-data/lab?tab=sql"
                          : "/student/skills/ai-data/lab?tab=python"
                      }
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "8px 18px",
                        borderRadius: 6,
                        backgroundColor: "#356AE6",
                        color: "#FFFFFF",
                        textDecoration: "none"
                      }}
                    >
                      Open Lab Sandbox with AI Mentor Active →
                    </Link>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* TAB 6: TECHNICAL INTERVIEW EXAM                               */}
              {/* ══════════════════════════════════════════════════════════════ */}
              {workspaceMode === "interview" && (
                <div
                  style={{
                    backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                    border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
                    borderRadius: 8,
                    padding: "20px 24px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: isDark ? "#FFFFFF" : "#0F172A" }}>
                        🎯 Technical Interview Assessment: {activeRoleProfile.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: isDark ? "#8FA0B8" : "#64748B" }}>
                        Industry-calibrated interview covering systems design, debugging incidents, and follow-ups.
                      </div>
                    </div>
                    <Link
                      href="/student/skills/ai-data/interview"
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: "7px 16px",
                        borderRadius: 6,
                        backgroundColor: "#356AE6",
                        color: "#FFFFFF",
                        textDecoration: "none"
                      }}
                    >
                      Start Live Interview Exam →
                    </Link>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      {
                        type: "SYSTEM DESIGN",
                        title: "Enterprise RAG Architecture at Scale",
                        provenance: "VERIFIED HISTORICAL: OpenAI Applied AI Solutions Round",
                        prompt: "Design sub-second retrieval across 500k documents with hybrid search and reranking."
                      },
                      {
                        type: "INCIDENT DEBUGGING",
                        title: "Silent Model Drift & ROC-AUC Degradation",
                        provenance: "VERIFIED HISTORICAL: Stripe Risk ML Infrastructure Round",
                        prompt: "Production model drops 15% ROC-AUC while API error rates remain 0%. Formulate diagnostic plan."
                      },
                      {
                        type: "STATISTICAL REASONING",
                        title: "Sample Ratio Mismatch Invalidation in A/B Testing",
                        provenance: "VERIFIED HISTORICAL: Booking.com Experimentation Assessment",
                        prompt: "Significant conversion lift with 54k/46k traffic split. Detect and explain selection bias."
                      }
                    ].map((q, idx) => (
                      <div
                        key={idx}
                        style={{
                          border: `1px solid ${isDark ? "#1E2A3B" : "#E2E8F0"}`,
                          borderRadius: 6,
                          padding: "12px 14px",
                          backgroundColor: isDark ? "#0A0F1D" : "#F8FAFC"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 800, color: "#356AE6", marginBottom: 2 }}>
                          <span>QUESTION {idx + 1}: {q.type}</span>
                          <span style={{ color: "#10B981" }}>{q.provenance}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#FFFFFF" : "#0F172A" }}>
                          {q.title}
                        </div>
                        <div style={{ fontSize: 11.5, color: isDark ? "#8FA0B8" : "#64748B", marginTop: 2 }}>
                          {q.prompt}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: isDark ? "#8FA0B8" : "#64748B" }}>
              Please select a topic from the curriculum sidebar to launch its dedicated learning workspace.
            </div>
          )}
        </main>
      </div>

      {/* ── CHALLENGE DETAIL MODAL ── */}
      {selectedChallenge && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.65)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 100,
            padding: 20
          }}
        >
          <div
            style={{
              backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
              border: `1px solid ${isDark ? "#22334A" : "#E4E1DA"}`,
              borderRadius: 10,
              maxWidth: 680,
              width: "100%",
              padding: "22px 26px",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#356AE6", textTransform: "uppercase" }}>
                  {selectedChallenge.category.replace(/_/g, " ")} • {selectedChallenge.difficulty.toUpperCase()}
                </span>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: "4px 0 0", color: isDark ? "#FFFFFF" : "#111827" }}>
                  {selectedChallenge.title}
                </h3>
                <div style={{ fontSize: 10.5, color: "#10B981", fontWeight: 700, marginTop: 2 }}>
                  Provenance: {selectedChallenge.provenance.type.toUpperCase()} ({selectedChallenge.provenance.sourceName})
                </div>
              </div>
              <button
                onClick={() => setSelectedChallenge(null)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: isDark ? "#8FA0B8" : "#6B7280" }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 2 }}>Realistic Scenario:</div>
              <p style={{ fontSize: 12, color: isDark ? "#B0C0D4" : "#4B5563", lineHeight: 1.5, margin: 0 }}>
                {selectedChallenge.scenario}
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>Acceptance Criteria:</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: isDark ? "#8FA0B8" : "#4B5563" }}>
                {selectedChallenge.acceptanceCriteria.map((c, i) => (
                  <li key={i} style={{ marginBottom: 2 }}>{c}</li>
                ))}
              </ul>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setSelectedChallenge(null)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: `1px solid ${isDark ? "#2E3F55" : "#D1D5DB"}`,
                  backgroundColor: "transparent",
                  color: isDark ? "#8FA0B8" : "#4B5563",
                  fontSize: 12,
                  cursor: "pointer"
                }}
              >
                Close
              </button>
              <Link
                href={`/student/skills/ai-data/lab?tab=${selectedChallenge.category.includes("sql") ? "sql" : "python"}`}
                style={{
                  padding: "6px 16px",
                  borderRadius: 6,
                  backgroundColor: "#356AE6",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: "none"
                }}
              >
                Open in Execution Lab Sandbox →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AiDataArenaPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Loading AI & Data Arena...</div>}>
      <AiDataArenaContent />
    </Suspense>
  );
}
