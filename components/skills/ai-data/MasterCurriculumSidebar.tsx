"use client";

import React, { useState, useMemo } from "react";
import {
  CANONICAL_MASTER_TRACKS,
  MASTER_CURRICULUM_SUBJECTS,
  TaxonomySubject,
  TaxonomyModule,
} from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import { TARGET_ROLE_PROFILES, getAllTargetRoles } from "@/lib/skills/ai-data/roles";
import { TargetRoleSlug } from "@/lib/skills/ai-data/types";

export interface MasterCurriculumSidebarProps {
  activeTopicId: string;
  completedTopicIds: string[];
  lockedTopicReasons?: Record<string, string>;
  remediationTopicIds?: string[];
  activeRole: TargetRoleSlug;
  onSelectTopic: (topicId: string) => void;
  onSelectRole: (role: TargetRoleSlug) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function MasterCurriculumSidebar({
  activeTopicId,
  completedTopicIds,
  lockedTopicReasons = {},
  remediationTopicIds = [],
  activeRole,
  onSelectTopic,
  onSelectRole,
  isCollapsed,
  onToggleCollapse,
}: MasterCurriculumSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTrackId, setActiveTrackId] = useState<"track_a_foundations" | "track_b_specialized">("track_a_foundations");
  
  // Track which subjects are expanded
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({
    subj_python: true,
    subj_numpy: true,
    subj_sql: true,
    subj_ml: true,
    subj_genai_llm: true,
  });

  // Track which modules are expanded
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const allRoles = useMemo(() => getAllTargetRoles(), []);
  const currentRoleProfile = TARGET_ROLE_PROFILES[activeRole] || TARGET_ROLE_PROFILES.ai_engineer;

  const toggleSubject = (subjId: string) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subjId]: !prev[subjId],
    }));
  };

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  // Filter subjects based on active track and search query
  const displayedSubjects = useMemo(() => {
    const currentTrackConfig = CANONICAL_MASTER_TRACKS.find((t) => t.id === activeTrackId);
    if (!currentTrackConfig) return [];

    const subjects = currentTrackConfig.subjectIds
      .map((id) => MASTER_CURRICULUM_SUBJECTS.find((s) => s.id === id))
      .filter((s): s is TaxonomySubject => !!s);

    if (!searchQuery.trim()) return subjects;

    const q = searchQuery.toLowerCase().trim();
    return subjects
      .map((subj) => {
        const matchesSubject = subj.title.toLowerCase().includes(q) || subj.description.toLowerCase().includes(q);
        const filteredModules = subj.modules
          .map((mod) => {
            const matchesModule = mod.title.toLowerCase().includes(q);
            const filteredTopics = mod.topics.filter(
              (t) =>
                t.title.toLowerCase().includes(q) ||
                t.conceptsCovered.some((c) => c.toLowerCase().includes(q)) ||
                t.subtopics?.some((st) => st.title.toLowerCase().includes(q))
            );
            if (matchesModule || filteredTopics.length > 0) {
              return {
                ...mod,
                topics: filteredTopics.length > 0 ? filteredTopics : mod.topics,
              };
            }
            return null;
          })
          .filter((m): m is TaxonomyModule => !!m);

        if (matchesSubject || filteredModules.length > 0) {
          return {
            ...subj,
            modules: filteredModules.length > 0 ? filteredModules : subj.modules,
          };
        }
        return null;
      })
      .filter((s): s is TaxonomySubject => !!s);
  }, [activeTrackId, searchQuery]);

  // Overall track completion stats
  const trackStats = useMemo(() => {
    let totalTopicsInTrack = 0;
    let completedInTrack = 0;
    const currentTrackConfig = CANONICAL_MASTER_TRACKS.find((t) => t.id === activeTrackId);
    if (currentTrackConfig) {
      for (const subjId of currentTrackConfig.subjectIds) {
        const subj = MASTER_CURRICULUM_SUBJECTS.find((s) => s.id === subjId);
        if (!subj) continue;
        for (const mod of subj.modules) {
          for (const topic of mod.topics) {
            totalTopicsInTrack++;
            if (completedTopicIds.includes(topic.id)) {
              completedInTrack++;
            }
          }
        }
      }
    }
    return {
      total: totalTopicsInTrack,
      completed: completedInTrack,
      percent: totalTopicsInTrack > 0 ? Math.round((completedInTrack / totalTopicsInTrack) * 100) : 0,
    };
  }, [activeTrackId, completedTopicIds]);

  // Collapsed Rail View on Desktop
  if (isCollapsed) {
    return (
      <aside
        style={{
          width: 54,
          flexShrink: 0,
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid #E4E1DA",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "16px 0",
          gap: 16,
          height: "calc(100vh - 56px)",
          position: "sticky",
          top: 56,
          zIndex: 20,
        }}
      >
        <button
          onClick={onToggleCollapse}
          title="Expand Curriculum Sidebar"
          style={{
            background: "#F6F5F1",
            border: "1px solid #E4E1DA",
            borderRadius: 7,
            padding: "6px 9px",
            color: "#162A43",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          ▶
        </button>
        <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 11, fontWeight: 800, color: "#667085", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Curriculum Tree
        </div>
      </aside>
    );
  }

  return (
    <aside
      style={{
        width: 320,
        flexShrink: 0,
        backgroundColor: "#FFFFFF",
        borderRight: "1px solid #E4E1DA",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 56px)",
        position: "sticky",
        top: 56,
        zIndex: 25,
      }}
    >
      {/* ── TOP CONTROLS: ROLE SELECTOR & COLLAPSE ── */}
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #E4E1DA", backgroundColor: "#FFFFFF" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14 }}>🎯</span>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "#162A43" }}>
              Career Pathway
            </span>
          </div>
          <button
            onClick={onToggleCollapse}
            title="Collapse Sidebar"
            style={{
              background: "transparent",
              border: "none",
              color: "#667085",
              cursor: "pointer",
              fontSize: 12,
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            ◀
          </button>
        </div>

        {/* Role Selector Dropdown */}
        <select
          value={activeRole}
          onChange={(e) => onSelectRole(e.target.value as TargetRoleSlug)}
          style={{
            width: "100%",
            padding: "7px 10px",
            borderRadius: 7,
            border: "1px solid #E4E1DA",
            backgroundColor: "#F6F5F1",
            color: "#162A43",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            outline: "none",
          }}
        >
          {allRoles.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.icon} {r.title}
            </option>
          ))}
        </select>

        {/* Role Badge & Salary Info */}
        <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, color: "#667085" }}>
          <span style={{ fontWeight: 600 }}>{currentRoleProfile.badge}</span>
          <span style={{ color: "#2E7D5B", fontWeight: 700 }}>{currentRoleProfile.salaryTier.split("/")[0].trim()}</span>
        </div>
      </div>

      {/* ── TRACK SWITCHER (TRACK A vs TRACK B) ── */}
      <div style={{ display: "flex", borderBottom: "1px solid #E4E1DA", backgroundColor: "#F9F8F5" }}>
        {CANONICAL_MASTER_TRACKS.map((track) => {
          const isActive = track.id === activeTrackId;
          return (
            <button
              key={track.id}
              onClick={() => setActiveTrackId(track.id)}
              style={{
                flex: 1,
                padding: "10px 8px",
                border: "none",
                background: isActive ? "#FFFFFF" : "transparent",
                borderBottom: isActive ? "2px solid #356AE6" : "2px solid transparent",
                color: isActive ? "#162A43" : "#667085",
                fontSize: 11,
                fontWeight: isActive ? 800 : 600,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                transition: "all 0.15s ease",
              }}
            >
              <span>{track.code === "TRACK_A" ? "🧱 Track A" : "🚀 Track B"}</span>
              <span style={{ fontSize: 9, color: isActive ? "#356AE6" : "#98A2B3" }}>
                {track.code === "TRACK_A" ? "Foundations" : "Specialized"}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── SEARCH & TRACK PROGRESS ── */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #E4E1DA", backgroundColor: "#FFFFFF" }}>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <input
            type="text"
            placeholder="Search concepts, topics, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 28px 6px 10px",
              borderRadius: 6,
              border: "1px solid #E4E1DA",
              backgroundColor: "#F6F5F1",
              fontSize: 11,
              color: "#17191C",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "#667085",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, color: "#667085", marginBottom: 4 }}>
          <span>Track Progress</span>
          <span style={{ fontWeight: 700, color: "#162A43" }}>
            {trackStats.completed}/{trackStats.total} ({trackStats.percent}%)
          </span>
        </div>
        <div style={{ height: 4, background: "#E4E1DA", borderRadius: 2, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${trackStats.percent}%`,
              background: trackStats.percent > 70 ? "#2E7D5B" : "#356AE6",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* ── SCROLLABLE HIERARCHICAL TREE ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {displayedSubjects.map((subj) => {
          const isSubjOpen = expandedSubjects[subj.id] ?? true;
          const subjTopicsCount = subj.modules.reduce((acc, m) => acc + m.topics.length, 0);
          const subjCompletedCount = subj.modules.reduce(
            (acc, m) => acc + m.topics.filter((t) => completedTopicIds.includes(t.id)).length,
            0
          );
          const isSubjCompleted = subjTopicsCount > 0 && subjCompletedCount === subjTopicsCount;

          return (
            <div key={subj.id} style={{ marginBottom: 4 }}>
              {/* Subject Accordion Header */}
              <div
                onClick={() => toggleSubject(subj.id)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 14px",
                  cursor: "pointer",
                  backgroundColor: isSubjOpen ? "#F6F5F1" : "#FFFFFF",
                  borderLeft: isSubjOpen ? "3px solid #356AE6" : "3px solid transparent",
                  transition: "background 0.1s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 15 }}>{subj.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: "#162A43",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={subj.title}
                    >
                      {subj.title}
                    </div>
                    <div style={{ fontSize: 10, color: "#667085" }}>
                      {subjCompletedCount}/{subjTopicsCount} completed
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {isSubjCompleted && <span style={{ color: "#2E7D5B", fontSize: 12 }}>✓</span>}
                  <span style={{ fontSize: 10, color: "#98A2B3" }}>{isSubjOpen ? "▼" : "▶"}</span>
                </div>
              </div>

              {/* Subject Modules & Topics */}
              {isSubjOpen && (
                <div style={{ paddingLeft: 12, borderLeft: "1px dashed #E4E1DA", marginLeft: 20 }}>
                  {subj.modules.map((mod) => {
                    const isModOpen = expandedModules[mod.id] ?? true;
                    return (
                      <div key={mod.id} style={{ marginTop: 4, marginBottom: 6 }}>
                        {/* Module Sub-Header */}
                        <div
                          onClick={() => toggleModule(mod.id)}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "4px 8px",
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#475569",
                            borderRadius: 4,
                          }}
                        >
                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {mod.title}
                          </span>
                          <span style={{ fontSize: 9, color: "#98A2B3" }}>{isModOpen ? "▾" : "▸"}</span>
                        </div>

                        {/* Topics List */}
                        {isModOpen && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingLeft: 4 }}>
                            {mod.topics.map((topic) => {
                              const isActive = topic.id === activeTopicId;
                              const isCompleted = completedTopicIds.includes(topic.id);
                              const lockReason = lockedTopicReasons[topic.id];
                              const isLocked = Boolean(lockReason) && !isCompleted;
                              const needsRemediation = remediationTopicIds.includes(topic.id);
                              const roleImportance = topic.roleRelevance?.[activeRole]?.importance;
                              const isCriticalForRole = roleImportance === "CRITICAL";

                              return (
                                <button
                                  key={topic.id}
                                  onClick={() => {
                                    if (!isLocked) onSelectTopic(topic.id);
                                  }}
                                  title={isLocked ? lockReason : topic.title}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "6px 8px",
                                    borderRadius: 6,
                                    border: "none",
                                    backgroundColor: isActive ? "#162A43" : "transparent",
                                    color: isActive ? "#FFFFFF" : isLocked ? "#98A2B3" : "#17191C",
                                    fontSize: 11.5,
                                    fontWeight: isActive ? 700 : 500,
                                    textAlign: "left",
                                    cursor: isLocked ? "not-allowed" : "pointer",
                                    opacity: isLocked ? 0.72 : 1,
                                    transition: "all 0.1s ease",
                                    gap: 6,
                                    width: "100%",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                                    <span style={{ fontSize: 10, color: isCompleted ? "#2E7D5B" : needsRemediation ? "#D97706" : isActive ? "#C4B5FD" : "#98A2B3" }}>
                                      {isCompleted ? "●" : isLocked ? "🔒" : needsRemediation ? "⚠" : "○"}
                                    </span>
                                    <span
                                      style={{
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: 200,
                                      }}
                                      title={topic.title}
                                    >
                                      {topic.title}
                                    </span>
                                  </div>

                                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    {isCriticalForRole && (
                                      <span
                                        title={`Critical for ${currentRoleProfile.title}`}
                                        style={{
                                          fontSize: 9,
                                          padding: "1px 4px",
                                          borderRadius: 3,
                                          background: isActive ? "rgba(255, 215, 0, 0.25)" : "#FEF3C7",
                                          color: isActive ? "#FDE047" : "#B45309",
                                          fontWeight: 800,
                                        }}
                                      >
                                        ★
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

