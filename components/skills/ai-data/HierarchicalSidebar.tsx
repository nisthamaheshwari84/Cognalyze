"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AiDataTrack, AiDataTrackSlug, AiDataLesson } from "@/lib/skills/ai-data/types";

interface HierarchicalSidebarProps {
  tracks: AiDataTrack[];
  activeTrackSlug: AiDataTrackSlug;
  selectedTopicSlug?: string;
  onSelectTrack: (slug: AiDataTrackSlug) => void;
  onSelectTopic: (topicSlug: string, lesson: AiDataLesson) => void;
  onLaunchStudio: (studioTarget: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isDark?: boolean;
  targetRoleTrackSlug?: string;
}

export default function HierarchicalSidebar({
  tracks,
  activeTrackSlug,
  selectedTopicSlug,
  onSelectTrack,
  onSelectTopic,
  onLaunchStudio,
  isCollapsed = false,
  onToggleCollapse,
  isDark = false,
  targetRoleTrackSlug
}: HierarchicalSidebarProps) {
  const [collapsedStages, setCollapsedStages] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");

  const activeTrack = tracks.find((t) => t.slug === activeTrackSlug) || tracks[0];

  const toggleStage = (stageNum: number) => {
    setCollapsedStages((prev) => ({
      ...prev,
      [stageNum]: !prev[stageNum]
    }));
  };

  const filteredStages = useMemo(() => {
    if (!activeTrack?.stages) return [];
    if (!searchQuery.trim()) return activeTrack.stages;
    const q = searchQuery.toLowerCase();
    return activeTrack.stages
      .map((stg) => {
        const matchingLessons = stg.lessons.filter(
          (l) =>
            l.title.toLowerCase().includes(q) ||
            l.canonicalSkill.toLowerCase().includes(q) ||
            l.exerciseType.toLowerCase().includes(q)
        );
        if (matchingLessons.length > 0 || stg.title.toLowerCase().includes(q)) {
          return {
            ...stg,
            lessons: matchingLessons.length > 0 ? matchingLessons : stg.lessons
          };
        }
        return null;
      })
      .filter(Boolean) as typeof activeTrack.stages;
  }, [activeTrack, searchQuery]);

  if (isCollapsed) {
    return (
      <aside
        style={{
          width: 52,
          flexShrink: 0,
          backgroundColor: isDark ? "#0A0F1D" : "#F8FAFC",
          borderRight: `1px solid ${isDark ? "#1E2A3B" : "#E2E8F0"}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "12px 0",
          gap: 16,
          height: "100%",
          zIndex: 20,
          transition: "width 0.2s ease"
        }}
      >
        <button
          onClick={onToggleCollapse}
          title="Expand Curriculum Sidebar"
          style={{
            background: "none",
            border: `1px solid ${isDark ? "#2A3F5F" : "#CBD5E1"}`,
            borderRadius: 6,
            padding: "6px 8px",
            color: isDark ? "#8FA0B8" : "#475569",
            cursor: "pointer",
            fontSize: 14
          }}
        >
          ▶
        </button>
        <span style={{ fontSize: 20 }} title={activeTrack?.title}>
          {activeTrack?.icon || "⚡"}
        </span>
        <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 11, fontWeight: 700, color: isDark ? "#64748B" : "#94A3B8", letterSpacing: 1 }}>
          CURRICULUM
        </div>
      </aside>
    );
  }

  return (
    <aside
      style={{
        width: 310,
        flexShrink: 0,
        backgroundColor: isDark ? "#0A0F1D" : "#F8FAFC",
        borderRight: `1px solid ${isDark ? "#1E2A3B" : "#E2E8F0"}`,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        userSelect: "none",
        zIndex: 20,
        transition: "width 0.2s ease"
      }}
    >
      {/* ── HEADER: Track Selector & Collapse Toggle ── */}
      <div
        style={{
          padding: "14px 14px 10px",
          borderBottom: `1px solid ${isDark ? "#1E2A3B" : "#E2E8F0"}`,
          backgroundColor: isDark ? "#0E1726" : "#FFFFFF"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <label style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 800, color: isDark ? "#8FA0B8" : "#64748B", letterSpacing: 0.5 }}>
            Curriculum Track
          </label>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              style={{
                background: "none",
                border: "none",
                fontSize: 11,
                color: isDark ? "#8FA0B8" : "#64748B",
                cursor: "pointer",
                padding: "2px 6px",
                borderRadius: 4
              }}
            >
              ◀ Collapse
            </button>
          )}
        </div>

        {/* Track Dropdown */}
        <select
          value={activeTrackSlug}
          onChange={(e) => onSelectTrack(e.target.value as AiDataTrackSlug)}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 6,
            backgroundColor: isDark ? "#16253C" : "#F1F5F9",
            border: `1px solid ${isDark ? "#2A3F5F" : "#CBD5E1"}`,
            color: isDark ? "#FFFFFF" : "#0F172A",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            outline: "none"
          }}
        >
          {tracks.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.icon} {t.title} {t.slug === targetRoleTrackSlug ? "★ Target" : ""}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10.5, color: isDark ? "#8FA0B8" : "#64748B", marginTop: 8 }}>
          <span>⏱️ {activeTrack?.estimatedHours || 0} hrs • {activeTrack?.stages?.length || 0} Stages</span>
          <span style={{ color: "#356AE6", fontWeight: 700 }}>
            {activeTrack?.stages?.reduce((acc, s) => acc + s.lessons.length, 0) || 0} Core Topics
          </span>
        </div>

        {/* Quick Search */}
        <div style={{ marginTop: 10 }}>
          <input
            type="text"
            placeholder="Search topics, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "6px 10px",
              fontSize: 11,
              borderRadius: 6,
              backgroundColor: isDark ? "#0A0F1D" : "#FFFFFF",
              border: `1px solid ${isDark ? "#1E2A3B" : "#CBD5E1"}`,
              color: isDark ? "#FFFFFF" : "#0F172A",
              outline: "none"
            }}
          />
        </div>
      </div>

      {/* ── STUDIOS QUICK LAUNCHERS ── */}
      <div
        style={{
          padding: "10px 12px",
          borderBottom: `1px solid ${isDark ? "#1E2A3B" : "#E2E8F0"}`,
          backgroundColor: isDark ? "#0A0F1D" : "#F8FAFC"
        }}
      >
        <div style={{ fontSize: 9.5, textTransform: "uppercase", fontWeight: 800, color: isDark ? "#64748B" : "#94A3B8", letterSpacing: 0.5, marginBottom: 6 }}>
          Practical Studios
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, fontSize: 10.5 }}>
          <button
            onClick={() => onLaunchStudio("sql_lab")}
            style={{
              padding: "5px 6px",
              borderRadius: 5,
              backgroundColor: isDark ? "#16253C" : "#FFFFFF",
              border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
              color: isDark ? "#CBD5E1" : "#1E293B",
              fontSize: 10.5,
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
            title="Launch In-Memory SQLite Lab"
          >
            ⚡ SQL Lab
          </button>
          <button
            onClick={() => onLaunchStudio("python_sandbox")}
            style={{
              padding: "5px 6px",
              borderRadius: 5,
              backgroundColor: isDark ? "#16253C" : "#FFFFFF",
              border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
              color: isDark ? "#CBD5E1" : "#1E293B",
              fontSize: 10.5,
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
            title="Launch Python Practice Sandbox"
          >
            🐍 Python
          </button>
          <button
            onClick={() => onLaunchStudio("agent_builder")}
            style={{
              padding: "5px 6px",
              borderRadius: 5,
              backgroundColor: isDark ? "#16253C" : "#FFFFFF",
              border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
              color: isDark ? "#CBD5E1" : "#1E293B",
              fontSize: 10.5,
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
            title="Launch Visual AI Agent Builder"
          >
            🤖 Agents
          </button>
          <button
            onClick={() => onLaunchStudio("pipeline_builder")}
            style={{
              padding: "5px 6px",
              borderRadius: 5,
              backgroundColor: isDark ? "#16253C" : "#FFFFFF",
              border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
              color: isDark ? "#CBD5E1" : "#1E293B",
              fontSize: 10.5,
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
            title="Launch Data & ML Pipeline Builder"
          >
            ⚙️ Pipelines
          </button>
          <button
            onClick={() => onLaunchStudio("ml_studio")}
            style={{
              padding: "5px 6px",
              borderRadius: 5,
              backgroundColor: isDark ? "#16253C" : "#FFFFFF",
              border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
              color: isDark ? "#CBD5E1" : "#1E293B",
              fontSize: 10.5,
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
            title="Launch ML Experiment Studio"
          >
            📊 ML Studio
          </button>
          <button
            onClick={() => onLaunchStudio("dry_run")}
            style={{
              padding: "5px 6px",
              borderRadius: 5,
              backgroundColor: isDark ? "#16253C" : "#FFFFFF",
              border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
              color: isDark ? "#CBD5E1" : "#1E293B",
              fontSize: 10.5,
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
            title="Launch Visual Dry-Run Tracer"
          >
            👁️ Dry-Run
          </button>
        </div>
      </div>

      {/* ── HIERARCHICAL CHAPTERS & TOPICS (Bounded Scroll) ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 10px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 8
        }}
      >
        {filteredStages.map((stage) => {
          const isCollapsedStage = collapsedStages[stage.stageNumber];
          const hasSelectedTopic = stage.lessons.some((l) => l.slug === selectedTopicSlug);

          return (
            <div
              key={stage.stageNumber}
              style={{
                borderRadius: 7,
                border: `1px solid ${hasSelectedTopic ? "#356AE6" : isDark ? "#1E2A3B" : "#E2E8F0"}`,
                backgroundColor: isDark ? "#0E1726" : "#FFFFFF",
                overflow: "hidden"
              }}
            >
              {/* Stage Header */}
              <div
                onClick={() => toggleStage(stage.stageNumber)}
                style={{
                  padding: "8px 10px",
                  backgroundColor: isDark ? "#121F33" : "#F1F5F9",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: isDark ? "#FFFFFF" : "#1E293B"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: "#356AE6",
                      color: "#FFFFFF",
                      fontSize: 10,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    {stage.stageNumber}
                  </span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {stage.title}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: isDark ? "#8FA0B8" : "#64748B" }}>
                    {stage.lessons.length}
                  </span>
                  <span style={{ fontSize: 9, color: isDark ? "#8FA0B8" : "#94A3B8" }}>
                    {isCollapsedStage ? "▶" : "▼"}
                  </span>
                </div>
              </div>

              {/* Lessons / Topics List */}
              {!isCollapsedStage && (
                <div style={{ padding: 4, display: "flex", flexDirection: "column", gap: 3 }}>
                  {stage.lessons.map((lesson) => {
                    const isSelected = selectedTopicSlug === lesson.slug;
                    return (
                      <button
                        key={lesson.slug}
                        onClick={() => onSelectTopic(lesson.slug, lesson)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "6px 8px",
                          borderRadius: 5,
                          fontSize: 11,
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          backgroundColor: isSelected
                            ? "#356AE6"
                            : "transparent",
                          color: isSelected
                            ? "#FFFFFF"
                            : isDark
                            ? "#CBD5E1"
                            : "#334155",
                          fontWeight: isSelected ? 700 : 500,
                          border: "none",
                          transition: "background-color 0.1s ease"
                        }}
                      >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 6 }}>
                          {lesson.title}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            padding: "1px 4px",
                            borderRadius: 3,
                            backgroundColor: isSelected
                              ? "rgba(255,255,255,0.25)"
                              : isDark
                              ? "#1A273C"
                              : "#E2E8F0",
                            color: isSelected
                              ? "#FFFFFF"
                              : isDark
                              ? "#94A3B8"
                              : "#64748B",
                            fontWeight: 700,
                            flexShrink: 0
                          }}
                        >
                          {lesson.exerciseType === "sql_lab"
                            ? "SQL"
                            : lesson.exerciseType === "code_lab"
                            ? "Code"
                            : "DAG"}
                        </span>
                      </button>
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
