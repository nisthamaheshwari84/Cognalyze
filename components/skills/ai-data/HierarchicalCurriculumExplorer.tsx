"use client";

import React, { useState, useMemo } from "react";
import { TargetRoleSlug } from "@/lib/skills/ai-data/types";
import {
  MASTER_CURRICULUM_SUBJECTS,
  TaxonomySubject,
  TaxonomyModule,
  TaxonomyTopic,
  TaxonomySubtopic,
} from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import {
  getRoleSubjectProgression,
  isSubjectUnlockedForCandidate,
  resolveNextTopicRecommendation,
} from "@/lib/skills/ai-data/sequencing-engine";

export interface HierarchicalCurriculumExplorerProps {
  role: TargetRoleSlug;
  selectedTopicId: string;
  completedTopicIds: string[];
  onSelectTopic: (topic: TaxonomyTopic, subject: TaxonomySubject) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function HierarchicalCurriculumExplorer({
  role,
  selectedTopicId,
  completedTopicIds = [],
  onSelectTopic,
  collapsed = false,
  onToggleCollapse,
}: HierarchicalCurriculumExplorerProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<Record<string, boolean>>({
    subj_python: true,
    subj_numpy: true,
  });
  const [expandedModuleIds, setExpandedModuleIds] = useState<Record<string, boolean>>({});

  // Get role-tailored sequence
  const roleProgression = useMemo(() => getRoleSubjectProgression(role), [role]);

  // Next recommended topic calculation
  const recommendation = useMemo(
    () => resolveNextTopicRecommendation(role, completedTopicIds),
    [role, completedTopicIds]
  );

  // Ordered subjects according to career role sequencing
  const orderedSubjects = useMemo(() => {
    return roleProgression.subjects
      .map((roleSubj) => {
        const full = MASTER_CURRICULUM_SUBJECTS.find((s) => s.id === roleSubj.subjectId);
        return {
          roleSubj,
          subject: full,
        };
      })
      .filter((item): item is { roleSubj: typeof item.roleSubj; subject: TaxonomySubject } => !!item.subject);
  }, [roleProgression]);

  // Toggle Subject Expansion
  const toggleSubject = (subjectId: string) => {
    setExpandedSubjectIds((prev) => ({
      ...prev,
      [subjectId]: !prev[subjectId],
    }));
  };

  // Toggle Module Expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModuleIds((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  // Filtered Subject Tree
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return orderedSubjects;

    const q = searchQuery.toLowerCase();
    return orderedSubjects.filter(({ subject }) => {
      const matchSubject = subject.title.toLowerCase().includes(q) || subject.description.toLowerCase().includes(q);
      const matchModule = subject.modules.some((m) =>
        m.title.toLowerCase().includes(q) ||
        m.topics.some(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.conceptsCovered.some((c) => c.toLowerCase().includes(q)) ||
            t.subtopics?.some((st) => st.title.toLowerCase().includes(q))
        )
      );
      return matchSubject || matchModule;
    });
  }, [orderedSubjects, searchQuery]);

  if (collapsed) {
    return (
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E4E1DA",
          borderRadius: 10,
          padding: "12px 6px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={onToggleCollapse}
          style={{
            background: "transparent",
            border: "1px solid #E4E1DA",
            borderRadius: 4,
            padding: "4px 8px",
            color: "#667085",
            fontSize: 11,
            cursor: "pointer",
          }}
          title="Expand Curriculum Explorer"
        >
          ▶
        </button>
        <div style={{ writingMode: "vertical-rl", fontSize: 11, fontWeight: 800, color: "#667085", letterSpacing: "0.05em", transform: "rotate(180deg)" }}>
          CURRICULUM TREE
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E4E1DA",
        borderRadius: 10,
        padding: "16px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxHeight: "calc(100vh - 170px)",
        overflowY: "auto",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      }}
    >
      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E4E1DA", paddingBottom: 10 }}>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: "#162A43", margin: 0, textTransform: "uppercase" }}>
            Hierarchical Curriculum
          </h3>
          <span style={{ fontSize: 10.5, color: "#667085" }}>
            {orderedSubjects.length} Sequential Subjects for {roleProgression.roleTitle}
          </span>
        </div>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            style={{
              background: "transparent",
              border: "1px solid #E4E1DA",
              borderRadius: 4,
              padding: "3px 6px",
              color: "#667085",
              fontSize: 10,
              cursor: "pointer",
            }}
            title="Collapse Sidebar"
          >
            ◀
          </button>
        )}
      </div>

      {/* ── SEARCH INPUT ── */}
      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter subjects, modules, topics..."
          style={{
            width: "100%",
            padding: "6px 10px",
            fontSize: 11,
            borderRadius: 6,
            border: "1px solid #E4E1DA",
            background: "#FAF9F6",
            color: "#162A43",
            outline: "none",
          }}
        />
      </div>

      {/* ── RECOMMENDED NEXT TOPIC QUICK-JUMP CARD ── */}
      {recommendation && !searchQuery && (
        <div
          onClick={() => onSelectTopic(recommendation.recommendedTopic, recommendation.subject)}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            background: "#EFF4FE",
            border: "1px solid #D2E0FB",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <span style={{ fontSize: 9.5, fontWeight: 800, color: "#356AE6", textTransform: "uppercase" }}>
              ★ Next Recommended Topic
            </span>
            <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "#FFFFFF", color: "#356AE6", fontWeight: 700 }}>
              {recommendation.subject.icon}
            </span>
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#162A43" }}>
            {recommendation.recommendedTopic.title}
          </div>
          <div style={{ fontSize: 10, color: "#667085", marginTop: 2 }}>
            {recommendation.module.title}
          </div>
        </div>
      )}

      {/* ── SUBJECT ACCORDION TREE ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filteredSubjects.map(({ roleSubj, subject }) => {
          const isExpanded = !!expandedSubjectIds[subject.id] || !!searchQuery.trim();
          const { isUnlocked, missingSubjectTitles } = isSubjectUnlockedForCandidate(
            subject.id,
            role,
            completedTopicIds
          );

          // Calculate subject topic completion count
          const allSubjectTopics = subject.modules.flatMap((m) => m.topics);
          const completedInSubject = allSubjectTopics.filter((t) => completedTopicIds.includes(t.id)).length;
          const isSubjectComplete = allSubjectTopics.length > 0 && completedInSubject === allSubjectTopics.length;

          return (
            <div
              key={subject.id}
              style={{
                borderRadius: 8,
                border: "1px solid #E4E1DA",
                background: isUnlocked ? "#FFFFFF" : "#FAF9F6",
                overflow: "hidden",
                opacity: isUnlocked ? 1 : 0.75,
              }}
            >
              {/* Subject Header */}
              <div
                onClick={() => toggleSubject(subject.id)}
                style={{
                  padding: "9px 10px",
                  background: isExpanded ? "#FAF9F6" : "#FFFFFF",
                  borderBottom: isExpanded ? "1px solid #E4E1DA" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14 }}>{subject.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: "#162A43", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {subject.title}
                      </span>
                      {isSubjectComplete && (
                        <span style={{ fontSize: 10, color: "#2E7D5B", fontWeight: 800 }}>✓</span>
                      )}
                      {!isUnlocked && (
                        <span title={`Recommended preparation: ${missingSubjectTitles.join(", ")}`} style={{ fontSize: 11 }}>
                          💡
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 9.5, color: "#667085" }}>
                      {roleSubj.roleImportance} · {completedInSubject}/{allSubjectTopics.length} done · {subject.estimatedHours}h
                    </div>
                  </div>
                </div>

                <span style={{ fontSize: 10, color: "#667085", marginLeft: 4 }}>
                  {isExpanded ? "▼" : "▶"}
                </span>
              </div>

              {/* Helpful Readiness Recommendation (Non-blocking) */}
              {!isUnlocked && isExpanded && (
                <div style={{ padding: "8px 10px", background: "#EFF4FE", borderBottom: "1px solid #D2E0FB", fontSize: 10.5, color: "#162A43", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12 }}>💡</span>
                  <div>
                    <strong>Recommended Preparation:</strong> We recommend exploring {missingSubjectTitles.join(", ")} first for optimal foundation, but all topics are 100% open to learn.
                  </div>
                </div>
              )}

              {/* Module & Topic Tree */}
              {isExpanded && (
                <div style={{ display: "flex", flexDirection: "column", padding: "6px 8px 10px" }}>
                  {subject.modules.map((mod) => {
                    const isModExpanded = expandedModuleIds[mod.id] !== false || !!searchQuery.trim();

                    return (
                      <div key={mod.id} style={{ marginTop: 6 }}>
                        {/* Module Header */}
                        <div
                          onClick={() => toggleModule(mod.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "4px 6px",
                            cursor: "pointer",
                            userSelect: "none",
                          }}
                        >
                          <span style={{ fontSize: 10, fontWeight: 800, color: "#667085", textTransform: "uppercase" }}>
                            {mod.title}
                          </span>
                          <span style={{ fontSize: 8, color: "#98A2B3" }}>
                            {isModExpanded ? "▼" : "▶"}
                          </span>
                        </div>

                        {/* Topics under module */}
                        {isModExpanded && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 3 }}>
                            {mod.topics.map((t) => {
                              const isTopicSelected = selectedTopicId === t.id;
                              const isTopicCompleted = completedTopicIds.includes(t.id);
                              const isNextRecommended = recommendation?.recommendedTopic?.id === t.id;

                              return (
                                <button
                                  key={t.id}
                                  onClick={() => onSelectTopic(t, subject)}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    textAlign: "left",
                                    padding: "6px 8px",
                                    borderRadius: 6,
                                    border: isTopicSelected
                                      ? "1px solid #162A43"
                                      : isNextRecommended
                                      ? "1px solid #356AE6"
                                      : "1px solid transparent",
                                    background: isTopicSelected
                                      ? "#162A43"
                                      : isNextRecommended
                                      ? "#EFF4FE"
                                      : isTopicCompleted
                                      ? "#F0FDF4"
                                      : "transparent",
                                    color: isTopicSelected
                                      ? "#FFFFFF"
                                      : isTopicCompleted
                                      ? "#166534"
                                      : "#17191C",
                                    fontSize: 11,
                                    fontWeight: isTopicSelected || isNextRecommended ? 700 : 500,
                                    cursor: "pointer",
                                    transition: "all 0.12s ease",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                                    <span style={{ fontSize: 10 }}>
                                      {isTopicCompleted
                                        ? "✓"
                                        : isNextRecommended
                                        ? "★"
                                        : "○"}
                                    </span>
                                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                      {t.title}
                                    </span>
                                  </div>

                                  <span
                                    style={{
                                      fontSize: 9,
                                      padding: "1px 4px",
                                      borderRadius: 4,
                                      background: isTopicSelected ? "rgba(255,255,255,0.2)" : "#E4E1DA",
                                      color: isTopicSelected ? "#FFFFFF" : "#667085",
                                      fontWeight: 700,
                                      textTransform: "uppercase",
                                      marginLeft: 4,
                                    }}
                                  >
                                    {t.difficulty[0]}
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

