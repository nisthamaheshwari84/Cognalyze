"use client";

import React, { useState, useEffect } from "react";
import {
  buildStudentPersonalizedRoadmap,
  StudentPersonalizedRoadmap,
  StudyTimeCommitment,
  PersonalizedTopicNode
} from "@/lib/skills/ai-data/personalized-roadmap-engine";
import { TargetRoleSlug } from "@/lib/skills/ai-data/types";
import { TARGET_ROLE_PROFILES } from "@/lib/skills/ai-data/roles";

interface PersonalizedRoadmapViewProps {
  candidateId?: string;
  initialRole?: TargetRoleSlug;
  onSelectTopic?: (topicSlug: string) => void;
  onLaunchVisualStudio?: (topicSlug: string) => void;
}

export default function PersonalizedRoadmapView({
  candidateId = "student-demo",
  initialRole = "ai_engineer",
  onSelectTopic,
  onLaunchVisualStudio
}: PersonalizedRoadmapViewProps) {
  const [targetRole, setTargetRole] = useState<TargetRoleSlug>(initialRole);
  const [commitment, setCommitment] = useState<StudyTimeCommitment>("1h_daily");
  const [roadmap, setRoadmap] = useState<StudentPersonalizedRoadmap | null>(null);
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({ 1: true, 2: true });

  useEffect(() => {
    const rm = buildStudentPersonalizedRoadmap({
      candidateId,
      targetRole,
      commitment
    });
    setRoadmap(rm);
  }, [candidateId, targetRole, commitment]);

  if (!roadmap) {
    return <div style={{ padding: 24, color: "#667085" }}>Loading personalized learning roadmap...</div>;
  }

  const toggleStage = (stageNum: number) => {
    setExpandedStages(prev => ({ ...prev, [stageNum]: !prev[stageNum] }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── TOP CONTROLS & PERSONALIZATION BAR ── */}
      <div style={{ background: "#FFFFFF", borderRadius: 12, border: "1px solid #E4E1DA", padding: "18px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18 }}>🧬</span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#162A43", margin: 0, letterSpacing: "-0.02em" }}>
                Personalized Learning Roadmap &amp; Prerequisite DAG
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#667085", maxWidth: 680, lineHeight: 1.4 }}>
              {roadmap.roleWhyOverview}
            </p>
          </div>

          {/* Role & Time Commitment Selectors */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Target Role Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F6F5F1", padding: "6px 12px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#667085" }}>Target Role:</span>
              <select
                value={targetRole}
                onChange={e => setTargetRole(e.target.value as TargetRoleSlug)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#162A43",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                {Object.values(TARGET_ROLE_PROFILES).map(r => (
                  <option key={r.slug} value={r.slug}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Commitment Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F6F5F1", padding: "6px 12px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#667085" }}>Time Commitment:</span>
              <select
                value={commitment}
                onChange={e => setCommitment(e.target.value as StudyTimeCommitment)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#162A43",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="30m_daily">30 mins / day (3.5 hrs/wk)</option>
                <option value="1h_daily">1 hour / day (7 hrs/wk)</option>
                <option value="2h_daily">2 hours / day (14 hrs/wk)</option>
                <option value="weekends_only">Weekends Only (8 hrs/wk)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── METRICS SUMMARY STRIP ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 18, paddingTop: 16, borderTop: "1px solid #E4E1DA" }}>
          <div style={{ background: "#FBFBFA", padding: "10px 14px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
            <div style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>Overall Progress</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#162A43", marginTop: 2 }}>
              {roadmap.overallProgressPercent}%
            </div>
            <div style={{ fontSize: 10, color: "#2E7D5B", fontWeight: 700, marginTop: 2 }}>
              {roadmap.completedTopicsCount} of {roadmap.totalTopics} topics verified
            </div>
          </div>

          <div style={{ background: "#FBFBFA", padding: "10px 14px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
            <div style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>Velocity Projection</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#356AE6", marginTop: 2 }}>
              {roadmap.estimatedWeeksToComplete} Weeks
            </div>
            <div style={{ fontSize: 10, color: "#667085", marginTop: 2 }}>
              at {roadmap.weeklyHours} hrs/week
            </div>
          </div>

          <div style={{ background: "#FBFBFA", padding: "10px 14px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
            <div style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>Projected Readiness</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#162A43", marginTop: 2 }}>
              {roadmap.projectedCompletionDate}
            </div>
            <div style={{ fontSize: 10, color: "#667085", marginTop: 2 }}>
              Target calibrated
            </div>
          </div>

          <div style={{ background: "#FBFBFA", padding: "10px 14px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
            <div style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>Evidence Gating</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#2E7D5B", marginTop: 2 }}>
              {roadmap.masteredTopicsCount} Mastered
            </div>
            <div style={{ fontSize: 10, color: "#667085", marginTop: 2 }}>
              Student DNA synced
            </div>
          </div>
        </div>
      </div>

      {/* ── RECOMMENDED NEXT TOPIC HERO BANNER ── */}
      {roadmap.recommendedNextTopic && (
        <div style={{ background: "linear-gradient(135deg, #162A43 0%, #1E3A5F 100%)", borderRadius: 12, padding: "20px 24px", color: "#FFFFFF", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 12, background: "#34D399", color: "#0B192C", padding: "2px 8px", borderRadius: 4, fontWeight: 800, textTransform: "uppercase" }}>
                Next Recommended Step
              </span>
              <span style={{ fontSize: 11, color: "#94A3B8" }}>
                Stage {roadmap.recommendedNextTopic.stageNumber} • {roadmap.recommendedNextTopic.durationMinutes} mins
              </span>
            </div>
            <h3 style={{ margin: "4px 0", fontSize: 18, fontWeight: 800, color: "#FFFFFF" }}>
              {roadmap.recommendedNextTopic.title}
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#CBD5E1", maxWidth: 600 }}>
              {roadmap.recommendedNextTopic.whyThisTopicMattersForRole}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {onLaunchVisualStudio && (
              <button
                onClick={() => onLaunchVisualStudio(roadmap.recommendedNextTopic!.slug)}
                style={{
                  padding: "9px 16px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.25)",
                  background: "rgba(255,255,255,0.1)",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                🎨 Open in Visual Studio
              </button>
            )}
            {onSelectTopic && (
              <button
                onClick={() => onSelectTopic(roadmap.recommendedNextTopic!.slug)}
                style={{
                  padding: "9px 18px",
                  borderRadius: 6,
                  border: "none",
                  background: "#10B981",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                Start Topic Learning ➔
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── COMPANY BENCHMARKS STRIP ── */}
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 800, color: "#162A43", margin: "0 0 10px" }}>
          Target Tier-1 Company Readiness Benchmarks
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {roadmap.companyBenchmarks.map(comp => (
            <div key={comp.companyName} style={{ background: "#FFFFFF", padding: "14px 16px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#162A43" }}>
                  {comp.logo} {comp.companyName}
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: comp.readinessPercentage > 75 ? "#2E7D5B" : "#B7791F" }}>
                  {comp.readinessPercentage}% Ready
                </span>
              </div>
              <div style={{ width: "100%", height: 6, background: "#F1EFE9", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ width: `${comp.readinessPercentage}%`, height: "100%", background: comp.readinessPercentage > 75 ? "#2E7D5B" : "#356AE6" }} />
              </div>
              <div style={{ fontSize: 10, color: "#667085" }}>
                Unlocked: <strong>{comp.unlockedRound}</strong>
              </div>
              {comp.missingGateSkill && (
                <div style={{ fontSize: 10, color: "#991B1B", marginTop: 4 }}>
                  Gap: {comp.missingGateSkill}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── MILESTONE STAGES ACCORDION ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h4 style={{ fontSize: 14, fontWeight: 800, color: "#162A43", margin: 0 }}>
          Curriculum Milestone Stages ({roadmap.milestones.length})
        </h4>

        {roadmap.milestones.map(stage => {
          const isExpanded = expandedStages[stage.stageNumber] ?? false;
          return (
            <div key={stage.stageNumber} style={{ background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA", overflow: "hidden" }}>
              {/* Stage Header */}
              <div
                onClick={() => toggleStage(stage.stageNumber)}
                style={{
                  padding: "14px 18px",
                  background: stage.status === "COMPLETED" ? "#F7FAF8" : "#FBFBFA",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  userSelect: "none"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      background: stage.status === "COMPLETED" ? "#EAF4EE" : "#EFF4FE",
                      color: stage.status === "COMPLETED" ? "#2E7D5B" : "#356AE6",
                      fontSize: 11,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {stage.status === "COMPLETED" ? "✓" : stage.stageNumber}
                  </span>
                  <div>
                    <h5 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#162A43" }}>
                      Stage {stage.stageNumber}: {stage.title}
                    </h5>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#667085" }}>
                      {stage.objective}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#667085" }}>
                    {stage.completedCount} / {stage.totalCount} completed ({stage.percentComplete}%)
                  </span>
                  <span style={{ fontSize: 12, color: "#667085" }}>{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Topics Grid */}
              {isExpanded && (
                <div style={{ padding: "12px 16px", background: "#FFFFFF", display: "flex", flexDirection: "column", gap: 8 }}>
                  {stage.topics.map(topic => {
                    const isLocked = topic.status === "LOCKED";
                    const isCompleted = topic.status === "COMPLETED";

                    return (
                      <div
                        key={topic.id}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 8,
                          border: isCompleted ? "1px solid #C8E4D3" : isLocked ? "1px dashed #E4E1DA" : "1px solid #D2E0FB",
                          background: isCompleted ? "#FBFDFB" : isLocked ? "#FAF9F8" : "#FFFFFF",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 10
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 260 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: isLocked ? "#94A3B8" : "#162A43" }}>
                              {isCompleted ? "✅" : isLocked ? "🔒" : "📖"} {topic.title}
                            </span>
                            <span style={{ fontSize: 10, color: "#667085" }}>
                              • {topic.durationMinutes} mins • {topic.level}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: isLocked ? "#94A3B8" : "#667085", lineHeight: 1.3 }}>
                            {isLocked ? topic.lockReason : topic.whyThisTopicMattersForRole}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          {onLaunchVisualStudio && !isLocked && (
                            <button
                              onClick={() => onLaunchVisualStudio(topic.slug)}
                              style={{
                                padding: "5px 10px",
                                background: "#F6F5F1",
                                border: "1px solid #E4E1DA",
                                borderRadius: 5,
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#162A43",
                                cursor: "pointer"
                              }}
                            >
                              🎨 Diagram
                            </button>
                          )}
                          {onSelectTopic && !isLocked && (
                            <button
                              onClick={() => onSelectTopic(topic.slug)}
                              style={{
                                padding: "5px 12px",
                                background: isCompleted ? "#EAF4EE" : "#356AE6",
                                color: isCompleted ? "#2E7D5B" : "#FFFFFF",
                                border: isCompleted ? "1px solid #C8E4D3" : "none",
                                borderRadius: 5,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer"
                              }}
                            >
                              {isCompleted ? "Review Topic" : "Practice Topic ➔"}
                            </button>
                          )}
                        </div>
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

