"use client";

import React, { useState, useEffect } from "react";
import {
  TaxonomyTopic,
  TaxonomySubtopic,
  TaxonomySubject,
} from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import { TargetRoleSlug } from "@/lib/skills/ai-data/types";
import { TARGET_ROLE_PROFILES } from "@/lib/skills/ai-data/roles";
import { CandidatePracticeAnalytics } from "@/lib/skills/ai-data/company-question-bank-types";

export interface TopicMasteryDnaViewProps {
  topic: TaxonomyTopic;
  subtopic: TaxonomySubtopic;
  subject?: TaxonomySubject;
  candidateId: string;
  targetRole: TargetRoleSlug;
  isCompleted: boolean;
  onRetakeAssessment?: () => void;
}

export default function TopicMasteryDnaView({
  topic,
  subtopic,
  subject,
  candidateId,
  targetRole,
  isCompleted,
  onRetakeAssessment,
}: TopicMasteryDnaViewProps) {
  const [analytics, setAnalytics] = useState<CandidatePracticeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const roleProfile = TARGET_ROLE_PROFILES[targetRole];

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/skills/ai-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "get_practice_analytics",
            candidateId,
          }),
        });
        const data = await res.json();
        if (data.success && data.analytics) {
          setAnalytics(data.analytics);
        }
      } catch (e) {
        console.error("Failed to load analytics:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [candidateId]);

  const evidenceLevel = isCompleted ? 5 : (analytics?.totalSolved || 0) > 5 ? 3 : (analytics?.totalAttempted || 0) > 0 ? 2 : 1;

  const evidenceLevelLabels: Record<number, { title: string; desc: string; badge: string; color: string }> = {
    1: { title: "Level 1: Content Viewed", desc: "Topic material has been opened and read.", badge: "Viewed", color: "#667085" },
    2: { title: "Level 2: Practice Attempted", desc: "Candidate has begun solving questions.", badge: "Attempted", color: "#B7791F" },
    3: { title: "Level 3: Competence Demonstrated", desc: "Questions solved with verified execution output.", badge: "Competent", color: "#356AE6" },
    4: { title: "Level 4: Independent Problem Solver", desc: "Consistent accuracy achieved without hints.", badge: "Independent", color: "#7C3AED" },
    5: { title: "Level 5: Formally Certified Mastery", desc: "Passed Topic Assessment with >= 80% independent score.", badge: "Verified Mastery", color: "#2E7D5B" },
    6: { title: "Level 6: Placement-Ready Technical Defense", desc: "Successfully defended in technical interview rounds.", badge: "Enterprise Ready", color: "#162A43" },
  };

  const currentLevelInfo = evidenceLevelLabels[evidenceLevel];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── TOP BADGE BANNER ── */}
      <div
        style={{
          background: isCompleted ? "#EAF4EE" : "#FFFFFF",
          border: isCompleted ? "1.5px solid #2E7D5B" : "1px solid #E4E1DA",
          borderRadius: 12,
          padding: "24px 28px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>{isCompleted ? "🛡️" : "🧬"}</span>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: currentLevelInfo.color }}>
                {currentLevelInfo.title}
              </span>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#162A43", margin: "0 0 6px" }}>
              Student DNA Evidence Record · {topic.title}
            </h2>

            <p style={{ margin: 0, fontSize: 13, color: "#475569", maxWidth: 640, lineHeight: 1.55 }}>
              Cognalyze Student DNA permanently tracks verified skills, coding precision, and assessment rigor.
              Unlike static resumes, every demonstrated competency in this arena carries verifiable sandbox telemetry.
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <span
              style={{
                fontSize: 12,
                padding: "6px 14px",
                borderRadius: 6,
                background: currentLevelInfo.color,
                color: "#FFFFFF",
                fontWeight: 800,
                display: "inline-block",
              }}
            >
              {currentLevelInfo.badge}
            </span>
            <div style={{ fontSize: 11, color: "#667085", marginTop: 6 }}>
              Candidate: <code>{candidateId}</code>
            </div>
          </div>
        </div>

        {/* 6-Level Evidence Progression Ribbon */}
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid #E4E1DA" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
            Verifiable Evidence Hierarchy:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
            {[1, 2, 3, 4, 5, 6].map((lvl) => {
              const info = evidenceLevelLabels[lvl];
              const isAchieved = evidenceLevel >= lvl;
              return (
                <div
                  key={lvl}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: isAchieved ? `1.5px solid ${info.color}` : "1px solid #E4E1DA",
                    background: isAchieved ? "#FAF9F6" : "#FFFFFF",
                    opacity: isAchieved ? 1 : 0.45,
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 800, color: info.color }}>
                    L{lvl} {isAchieved ? "✓" : "○"}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#162A43", marginTop: 2 }}>
                    {info.badge}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── PERFORMANCE TELEMETRY GRID ── */}
      {analytics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>Total Questions Attempted</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#162A43", marginTop: 4 }}>
              {analytics.totalAttempted}
            </div>
            <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>
              Across all subtopics
            </div>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>Correct Solutions</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#2E7D5B", marginTop: 4 }}>
              {analytics.totalSolved}
            </div>
            <div style={{ fontSize: 11, color: "#2E7D5B", marginTop: 2 }}>
              Verified sandbox passes
            </div>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>Overall Accuracy</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#356AE6", marginTop: 4 }}>
              {analytics.overallAccuracyPercent}%
            </div>
            <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>
              First-attempt precision
            </div>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>Avg Solution Time</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#162A43", marginTop: 4 }}>
              {analytics.averageTimeSpentSeconds}s
            </div>
            <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>
              Fast reasoning index
            </div>
          </div>
        </div>
      )}

      {/* ── ACTION ROW: CERTIFICATION CALLOUT ── */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E4E1DA",
          borderRadius: 10,
          padding: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43" }}>
            {isCompleted ? "Mastery Verified & Synchronized" : "Take the Topic Assessment to Certify Mastery"}
          </div>
          <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
            Achieve 80% or higher on the timed assessment to advance your Student DNA to Level 5.
          </div>
        </div>

        {onRetakeAssessment && (
          <button
            onClick={onRetakeAssessment}
            style={{
              padding: "9px 18px",
              borderRadius: 6,
              border: "none",
              background: "#162A43",
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {isCompleted ? "Retake Assessment for Practice" : "Launch 20-Min Assessment ➔"}
          </button>
        )}
      </div>
    </div>
  );
}

